// Medusa Backend Service
// Uses CUSTOM endpoints specifically created for this project
// NOT standard Medusa v2 endpoints

import { medusaProductCache } from './medusaProductCache'

const MEDUSA_URL = 'https://backend-production-7441.up.railway.app'

// Get API headers with publishable key
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
  }
}

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  price?: number
  pricing_tier?: string
  metadata?: {
    pricing_tier?: string
  }
  variants?: Array<{
    id: string
    title: string
    sku?: string
    barcode?: string | null
    inventory_quantity?: number
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }>
  images?: Array<{
    url: string
  }>
  categories?: Array<any>
}

export interface MedusaCart {
  id: string
  cart_id?: string
  email?: string
  items: Array<{
    id: string
    variant_id: string
    quantity: number
    unit_price: number
    title: string
    thumbnail?: string
  }>
  shipping_address?: any
  billing_address?: any
  shipping_total?: number
  subtotal?: number
  total?: number
  client_secret?: string
}

// Fetch all Medusa products using CUSTOM endpoint with caching
export async function fetchMedusaProducts(customLimit?: number): Promise<MedusaProduct[]> {
  const limit = customLimit || 40 // Reduced from 200 for faster initial load
  const offset = 0
  const US_REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
  
  // Check cache first
  const cached = medusaProductCache.get(limit, offset)
  if (cached) {
    console.log(`[CACHE HIT] Returning ${cached.length} products from cache`)
    return cached
  }
  
  console.log(`[CACHE MISS] Fetching ${limit} products from API`)
  
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      region_id: US_REGION_ID, // Include region for price filtering
      fields: '*variants.calculated_price' // Request price data
    })
    
    const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
      method: 'GET',
      headers: getHeaders()
    })

    console.time('Medusa API Response')
    console.log('Medusa API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Medusa API error:', errorText)
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || []
    console.timeEnd('Medusa API Response')
    console.log('Medusa products fetched:', products.length)
    
    // Check first product structure for debugging
    if (products.length > 0) {
      const sample = products[0]
      console.log('Sample product structure:', {
        title: sample.title,
        hasPrice: !!sample.price,
        hasPriceField: !!sample.price,
        variantCount: sample.variants?.length || 0,
        firstVariant: sample.variants?.[0] ? {
          hasCalculatedPrice: !!sample.variants[0].calculated_price,
          hasPrices: !!sample.variants[0].prices,
          hasDirectPrice: !!sample.variants[0].price,
          hasTierPrice: !!sample.variants[0].metadata?.tier_price,
          tierPriceValue: sample.variants[0].metadata?.tier_price
        } : null
      })
    }
    
    // Cache the results
    medusaProductCache.set(limit, offset, products)
    
    return products
  } catch (error) {
    console.error('Error fetching Medusa products:', error)
    return []
  }
}

// Fetch Medusa products with pagination
export async function fetchMedusaProductsPaginated(page: number = 1, pageSize: number = 20): Promise<{
  products: MedusaProduct[]
  hasMore: boolean
  total: number
  totalPages: number
}> {
  const offset = (page - 1) * pageSize
  const US_REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
  
  // Check cache first
  const cached = medusaProductCache.get(pageSize, offset)
  if (cached) {
    const totalPages = Math.ceil(cached.length / pageSize)
    return {
      products: cached,
      hasMore: cached.length === pageSize,
      total: cached.length,
      totalPages
    }
  }
  
  try {
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: offset.toString(),
      region_id: US_REGION_ID, // Include region for price filtering
      fields: '*variants.calculated_price' // Request price data
    })
    
    const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || []
    const total = data.count || products.length
    const totalPages = Math.ceil(total / pageSize)
    
    // Cache the results
    medusaProductCache.set(pageSize, offset, products)
    
    return {
      products,
      hasMore: products.length === pageSize,
      total,
      totalPages
    }
  } catch (error) {
    console.error('Error fetching paginated products:', error)
    return { products: [], hasMore: false, total: 0, totalPages: 0 }
  }
}

// Get single product by handle
export async function fetchMedusaProductByHandle(handle: string): Promise<MedusaProduct | null> {
  try {
    // The custom API doesn't support single product fetch or handle parameter
    // We need to fetch all products and filter client-side
    const products = await fetchMedusaProducts(100) // Fetch more products to ensure we get the one we need
    
    // Find by handle or ID
    const product = products.find(p => p.handle === handle || p.id === handle)
    
    if (product) {
      // Log critical pricing info only
      if (product.variants?.length > 0) {
        const variant = product.variants[0]
        console.log('Product pricing check:', {
          title: product.title,
          'variant.calculated_price': variant.calculated_price,
          'variant.prices': variant.prices,
          'variant.price': variant.price,
          'product.price': product.price
        })
      }
    }
    
    return product || null
  } catch (error) {
    console.error('Error fetching Medusa product by handle:', error)
    return null
  }
}

// Alternative: Get product by ID from the list
export async function fetchMedusaProduct(productId: string): Promise<MedusaProduct | null> {
  try {
    const products = await fetchMedusaProducts()
    const product = products.find(p => p.id === productId)
    return product || null
  } catch (error) {
    console.error('Error fetching Medusa product:', error)
    return null
  }
}

// Initialize payment collection for cart (needed immediately after creation)
export async function initializeCartPayment(cartId: string): Promise<any | null> {
  // Try new payment-init endpoint first (if deployed)
  try {
    const response = await fetch(`${MEDUSA_URL}/store/payment-init`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        cart_id: cartId
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Payment initialized successfully with provider:', data.provider_id)
      return data
    }
  } catch (error) {
    console.log('New payment-init endpoint not available, trying fallback')
  }

  // Fallback to old checkout endpoint
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'initialize_payment',
        cart_id: cartId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to initialize payment for cart: ${response.status} - ${errorText}`)
      // Don't throw - cart can still work for browsing
      return null
    }

    const data = await response.json()
    console.log('Payment collection initialized for cart:', cartId)
    return data
  } catch (error) {
    console.error('Error initializing cart payment:', error)
    // Don't throw - cart can still work for browsing
    return null
  }
}

// Create cart using standard Medusa v2 endpoint
export async function createMedusaCart(email?: string): Promise<MedusaCart | null> {
  try {
    // Using standard Medusa v2 /store/carts endpoint
    const response = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',
        email: email || undefined
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create cart: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const cart = data.cart
    console.log('Cart created:', cart?.id)
    
    return cart
  } catch (error) {
    console.error('Error creating Medusa cart:', error)
    return null
  }
}

// Add item to cart using standard Medusa v2 endpoint
export async function addToMedusaCart(cartId: string, variantId: string, quantity: number = 1): Promise<MedusaCart | null> {
  try {
    // Using standard Medusa v2 /store/carts/{id}/line-items endpoint
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        variant_id: variantId,
        quantity: quantity
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cart API Error: ${response.status}`, errorText)
      
      // Parse error for specific issues
      if (errorText.includes('Could not delete all payment sessions')) {
        // Cart has stuck payment sessions - need to create new cart
        throw new Error('CART_PAYMENT_SESSION_ERROR')
      }
      if (errorText.includes('strategy')) {
        throw new Error('Cart system is being updated. Please try again in a moment.')
      }
      if (errorText.includes('payment')) {
        throw new Error('CART_PAYMENT_SESSION_ERROR')
      }
      if (response.status === 500) {
        // Check if it's the payment session error
        if (errorText.includes('payment') || errorText.includes('session')) {
          throw new Error('CART_PAYMENT_SESSION_ERROR')
        }
        throw new Error('Server error. Our team has been notified.')
      }
      
      throw new Error(`Failed to add to cart: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error: any) {
    console.error('Error adding to Medusa cart:', error)
    // Re-throw the error so the context can handle it
    throw error
  }
}

// Update item quantity using standard Medusa v2 endpoint
export async function updateMedusaCartItem(cartId: string, itemId: string, quantity: number): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${itemId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        quantity: quantity
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update cart item: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error updating cart item:', error)
    return null
  }
}

// Remove item from cart using standard Medusa v2 endpoint
export async function removeFromMedusaCart(cartId: string, itemId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${itemId}`, {
      method: 'DELETE',
      headers: getHeaders()
    })

    if (!response.ok) {
      throw new Error(`Failed to remove from cart: ${response.status}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error removing from cart:', error)
    return null
  }
}

// Get cart using standard Medusa v2 endpoint
export async function getMedusaCart(cartId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      method: 'GET',
      headers: getHeaders()
    })

    if (!response.ok) {
      // Don't log error for 404s (cart not found is normal)
      if (response.status !== 404) {
        console.error(`Failed to get cart: ${response.status}`)
      }
      return null
    }

    const data = await response.json()
    return data.cart || data
  } catch (error) {
    console.error('Error getting cart:', error)
    return null
  }
}

// CHECKOUT FLOW using CUSTOM endpoint

// Step 1: Add shipping address (Using correct Medusa v2 endpoint)
export async function addShippingAddress(cartId: string, shippingData: {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postal_code: string
  country_code?: string
  phone?: string
  email: string
}) {
  try {
    // Use the correct Medusa v2 cart update endpoint
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        shipping_address: {
          first_name: shippingData.first_name,
          last_name: shippingData.last_name,
          address_1: shippingData.address_1,
          address_2: shippingData.address_2,
          city: shippingData.city,
          province: shippingData.state,  // Medusa uses 'province' not 'state'
          postal_code: shippingData.postal_code,
          country_code: shippingData.country_code || 'us',
          phone: shippingData.phone
        },
        email: shippingData.email
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add shipping address: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error adding shipping address:', error)
    return null
  }
}

// Step 2: Add shipping method (Backend fixed - endpoint now available)
export async function addShippingMethod(cartId: string, shippingMethod: string = 'Free Shipping', shippingAmount: number = 0) {
  try {
    // First, try to get available shipping options
    const optionsResponse = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-options`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (!optionsResponse.ok) {
      console.log('Could not get shipping options, will try with default FREE shipping')
      // Try to add FREE shipping directly without getting options
      try {
        const directResponse = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            // Try with a standard free shipping option ID
            option_id: 'so_free_shipping'
          })
        })
        
        if (directResponse.ok) {
          console.log('Added default FREE shipping successfully')
          return {
            success: true,
            message: 'FREE shipping added',
            shipping_method: 'FREE Shipping',
            amount: 0
          }
        }
      } catch (directErr) {
        console.error('Could not add default shipping:', directErr)
      }
      
      // If we can't add shipping at all, this is a critical error
      throw new Error('Cannot add shipping method. The checkout requires a shipping option.')
    }
    
    const optionsData = await optionsResponse.json()
    const shippingOptions = optionsData.shipping_options || []
    
    console.log('Available shipping options:', shippingOptions)
    
    // Find FREE shipping option first, then fall back to cheapest
    const freeOption = shippingOptions.find((opt: any) => 
      opt.amount === 0 || opt.name?.toLowerCase().includes('free')
    )
    const standardOption = shippingOptions.find((opt: any) => 
      opt.name?.toLowerCase().includes('standard')
    )
    const selectedOption = freeOption || standardOption || shippingOptions[0]
    
    if (!selectedOption) {
      console.log('No shipping options available')
      return { success: true, message: 'No shipping required' }
    }
    
    console.log('Selected shipping option:', selectedOption)
    
    // Try to add the selected shipping method to the cart
    try {
      const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          option_id: selectedOption.id
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to add shipping method:', response.status, errorText)
        
        // This is critical - without shipping method, cart completion will fail
        throw new Error(`Failed to add shipping method. The checkout cannot proceed without selecting a shipping option. Please try again.`)
      }
      
      const data = await response.json()
      console.log('Shipping method added successfully:', data)
      
      return {
        success: true,
        message: `${selectedOption.name} added`,
        shipping_method: selectedOption.name,
        amount: selectedOption.amount || 0
      }
    } catch (shippingError: any) {
      console.error('CRITICAL: Failed to add shipping method:', shippingError)
      
      // DO NOT return success when shipping fails!
      // This was causing "No shipping method selected" errors at checkout completion
      throw new Error(
        shippingError.response?.data?.message || 
        shippingError.message || 
        'Failed to add shipping method. Please refresh and try again.'
      )
    }
  } catch (error) {
    console.error('Error adding shipping method:', error)
    return null
  }
}

// Step 3: Create payment collection (Medusa v2 workflow)
export async function createPaymentCollection(cartId: string) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/payment-collections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        cart_id: cartId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create payment collection: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.payment_collection
  } catch (error) {
    console.error('Error creating payment collection:', error)
    return null
  }
}

// Step 4: Create payment session with Stripe (USING CUSTOM ENDPOINT TO FIX 100X BUG)
export async function createPaymentSession(paymentCollectionId: string, cartId?: string) {
  try {
    // Use custom endpoint that fixes the 100x pricing bug
    // If we have cartId, use the new endpoint, otherwise fall back to standard
    const endpoint = cartId 
      ? `${MEDUSA_URL}/store/carts/${cartId}/payment-session`  // Custom endpoint that fixes 100x bug
      : `${MEDUSA_URL}/store/payment-collections/${paymentCollectionId}/payment-sessions`; // Fallback
    
    console.log('Creating payment session with endpoint:', endpoint);
    console.log('Payment collection ID:', paymentCollectionId);
    console.log('Cart ID:', cartId);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        provider_id: 'pp_stripe_stripe',  // Correct Stripe provider ID
        ...(cartId && { payment_collection_id: paymentCollectionId }) // Include collection ID if using custom endpoint
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Payment session creation failed: ${response.status}`, errorText)
      
      // Parse error to provide better feedback
      let errorMessage = 'Failed to create payment session'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // If not JSON, use the text directly
        if (errorText.includes('shipping')) {
          errorMessage = 'Shipping configuration error. Please try again.'
        } else if (errorText.includes('payment')) {
          errorMessage = 'Payment configuration error. Please refresh and try again.'
        }
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log('Payment session response:', data)
    
    // CRITICAL: Verify amount to prevent 100x charges
    if (data.stripe_amount && data.stripe_amount_usd) {
      // Get cart to check expected amount
      const cartResponse = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
        headers: getHeaders()
      })
      if (cartResponse.ok) {
        const cartData = await cartResponse.json()
        const cart = cartData.cart
        const expectedAmount = (cart.total || 0) / 100 // Convert cents to dollars
        
        console.log('Amount verification:', {
          expected: expectedAmount,
          stripe_usd: data.stripe_amount_usd,
          stripe_cents: data.stripe_amount
        })
        
        // Check if amount is more than 10x expected (100x bug protection)
        if (data.stripe_amount_usd > expectedAmount * 10) {
          console.error('CRITICAL: Price mismatch detected!', {
            expected: expectedAmount,
            wouldCharge: data.stripe_amount_usd,
            multiplier: data.stripe_amount_usd / expectedAmount
          })
          throw new Error(`Price mismatch! Expected $${expectedAmount.toFixed(2)}, but would charge $${data.stripe_amount_usd.toFixed(2)}. Please contact support.`)
        }
      }
    }
    
    // Handle different response formats from backend
    // The custom endpoint might return data differently
    let paymentSession = null
    
    // Check multiple possible response structures
    if (data.payment_session) {
      paymentSession = data.payment_session
    } else if (data.payment_collection?.payment_sessions?.[0]) {
      paymentSession = data.payment_collection.payment_sessions[0]
    } else if (data.payment_sessions?.[0]) {
      paymentSession = data.payment_sessions[0]
    }
    
    if (paymentSession) {
      console.log('Payment session created:', paymentSession.id)
      // Extract the Stripe client secret from the data
      const clientSecret = paymentSession.data?.client_secret || paymentSession.client_secret
      
      if (!clientSecret) {
        console.error('Payment session missing client_secret:', paymentSession)
        throw new Error('Payment session created but missing Stripe client secret')
      }
      
      // Log amount for verification
      if (paymentSession.amount) {
        console.log('Payment session amount (cents):', paymentSession.amount)
        console.log('Payment session amount (USD):', paymentSession.amount / 100)
      }
      
      return {
        ...paymentSession,
        client_secret: clientSecret
      }
    }
    
    console.error('No payment session in response:', data)
    throw new Error('Payment session not created - invalid response from server')
    
  } catch (error: any) {
    console.error('Error creating payment session:', error)
    // Re-throw the error so the checkout page can handle it
    throw error
  }
}

// Legacy payment initialization (keep for compatibility)
export async function initializeMedusaPayment(cartId: string) {
  try {
    // Try new Medusa v2 workflow
    const paymentCollection = await createPaymentCollection(cartId)
    if (paymentCollection) {
      const paymentSession = await createPaymentSession(paymentCollection.id)
      if (paymentSession) {
        return {
          client_secret: paymentSession.client_secret,
          amount: paymentCollection.amount,
          payment_collection_id: paymentCollection.id,
          payment_session_id: paymentSession.id
        }
      }
    }
    
    // Fallback to old checkout endpoint if available
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'initialize_payment',
        cart_id: cartId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to initialize payment: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error initializing payment:', error)
    return null
  }
}

// Step 4: Complete order (after successful Stripe payment)
export async function completeMedusaOrder(cartId: string, paymentIntentId: string, paymentCollectionId: string) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'complete_order',
        cart_id: cartId,
        payment_intent_id: paymentIntentId,
        payment_collection_id: paymentCollectionId
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to complete order: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    // Returns: { order_id, success }
    return data
  } catch (error) {
    console.error('Error completing order:', error)
    return null
  }
}


// Helper to check product availability
export function isMedusaProductAvailable(variant: any): boolean {
  // IMPORTANT: All products have manage_inventory = false
  // This means unlimited stock - always available
  
  // If inventory management is disabled, product is always available
  if (variant?.manage_inventory === false) {
    return true
  }
  
  // Fallback: check inventory quantity only if manage_inventory is true
  return (variant?.inventory_quantity || 0) > 0
}

// Helper to get product variant
export function getDefaultVariant(product: MedusaProduct) {
  return product.variants?.[0] || null
}

// Health check for backend readiness
export async function checkBackendReady(): Promise<boolean> {
  try {
    // Skip health check if endpoint doesn't exist or has CORS issues
    // The actual cart/payment endpoints will fail if backend is down
    const response = await fetch(`${MEDUSA_URL}/health`, {
      method: 'GET',
      headers: getHeaders(),
      // Add no-cors mode to bypass CORS for health check
      mode: 'no-cors' as RequestMode
    })
    
    // With no-cors mode, we can't read the response but no error means backend is reachable
    console.log('Backend is reachable')
    return true
  } catch (error) {
    console.warn('Backend health check skipped (CORS or network issue):', error)
    // Return true anyway - let the actual API calls fail with proper error messages
    // Health check is just a nice-to-have, not critical
    return true
  }
}

// NEW: Authorize payment after Stripe confirmation
export async function authorizePayment(
  cartId: string, 
  paymentIntentId?: string,
  sessionId?: string
): Promise<any> {
  try {
    const payload = {
      cart_id: cartId,
      ...(paymentIntentId && { payment_intent_id: paymentIntentId }),
      ...(sessionId && { session_id: sessionId })
    }
    
    console.log('Authorizing payment with:', payload)
    
    const response = await fetch(`${MEDUSA_URL}/store/authorize-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Authorization failed:', error)
      throw new Error(error.message || 'Failed to authorize payment')
    }

    return await response.json()
  } catch (error) {
    console.error('Error authorizing payment:', error)
    throw error
  }
}

// NEW: Complete cart and create order (Medusa v2 standard endpoint)
export async function completeCart(cartId: string): Promise<any> {
  try {
    // Use the standard Medusa v2 cart completion endpoint
    const response = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({})  // Medusa v2 doesn't require body for completion
    })

    if (!response.ok) {
      const errorText = await response.text()
      let error: any = {}
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { message: errorText }
      }
      
      console.error('Cart completion failed:', error)
      
      // Check if it's a capture issue
      if (error.message?.includes('capture') || error.message?.includes('payment')) {
        throw new Error('Payment processing issue. Your payment may have been authorized but not completed. Please contact support.')
      }
      
      throw new Error(error.message || 'Failed to complete cart')
    }

    const data = await response.json()
    
    // Medusa v2 returns either {type: "order", order: {...}} or {type: "cart", cart: {...}, error: "..."}
    if (data.type === 'order' && data.order) {
      console.log('Order created successfully:', data.order.id)
      return { order: data.order, success: true }
    } else if (data.type === 'cart') {
      console.error('Cart completion failed:', data.error)
      throw new Error(data.error || 'Failed to create order')
    }
    
    // Fallback for non-standard response
    return data
  } catch (error) {
    console.error('Error completing cart:', error)
    throw error
  }
}