// Medusa Backend Service
// Uses CUSTOM endpoints specifically created for this project
// NOT standard Medusa v2 endpoints

import { medusaProductCache } from './medusaProductCache'
import { getProductPrice } from '@/utils/pricing'

const MEDUSA_URL = 'https://backend-production-7441.up.railway.app'

// Get API headers with publishable key
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
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
    tier_price?: number
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
  const US_REGION_ID = 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD' // US region for proper pricing
  
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
      region_id: US_REGION_ID // Include region for price filtering
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
        hasMetadataTierPrice: !!sample.metadata?.tier_price,
        variantCount: sample.variants?.length || 0,
        firstVariant: sample.variants?.[0] ? {
          hasCalculatedPrice: !!sample.variants[0].calculated_price,
          hasPrices: !!sample.variants[0].prices,
          hasDirectPrice: !!sample.variants[0].price
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
  const US_REGION_ID = 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD' // US region for proper pricing
  
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
      region_id: US_REGION_ID // Include region for price filtering
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

// Create cart using CUSTOM endpoint (with automatic payment initialization)
export async function createMedusaCart(email?: string): Promise<MedusaCart | null> {
  try {
    // Step 1: Create the cart
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'create',
        customer_email: email || ''
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create cart: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const cartId = data.cart_id || data.id
    console.log('Cart created:', cartId)
    
    // Step 2: Initialize payment collection immediately
    // This prevents the "strategy" error when adding items
    if (cartId) {
      await initializeCartPayment(cartId)
    }
    
    return data
  } catch (error) {
    console.error('Error creating Medusa cart:', error)
    return null
  }
}

// Add item to cart using CUSTOM endpoint
export async function addToMedusaCart(cartId: string, variantId: string, quantity: number = 1): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_item',
        cart_id: cartId,
        variant_id: variantId,
        quantity: quantity
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add to cart: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.cart
  } catch (error) {
    console.error('Error adding to Medusa cart:', error)
    return null
  }
}

// Update item quantity using CUSTOM endpoint
export async function updateMedusaCartItem(cartId: string, itemId: string, quantity: number): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'update_item',
        cart_id: cartId,
        item_id: itemId,
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

// Remove item from cart using CUSTOM endpoint
export async function removeFromMedusaCart(cartId: string, itemId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'remove_item',
        cart_id: cartId,
        item_id: itemId
      })
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

// Get cart using CUSTOM endpoint
export async function getMedusaCart(cartId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/cart-operations?cart_id=${cartId}`, {
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
    return data.cart
  } catch (error) {
    console.error('Error getting cart:', error)
    return null
  }
}

// CHECKOUT FLOW using CUSTOM endpoint

// Step 1: Add shipping address
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
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_shipping_address',
        cart_id: cartId,
        ...shippingData,
        country_code: shippingData.country_code || 'us'
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

// Step 2: Add shipping method
export async function addShippingMethod(cartId: string, shippingMethod: string = 'Standard Shipping', shippingAmount: number = 10) {
  try {
    const response = await fetch(`${MEDUSA_URL}/store/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action: 'add_shipping_method',
        cart_id: cartId,
        shipping_method: shippingMethod,
        shipping_amount: shippingAmount
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to add shipping method: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error adding shipping method:', error)
    return null
  }
}

// Step 3: Initialize payment
export async function initializeMedusaPayment(cartId: string) {
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
      throw new Error(`Failed to initialize payment: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    // Returns: { client_secret, amount, payment_collection_id, payment_session_id }
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

// Helper to get display price - delegates to centralized pricing utility
export function getMedusaDisplayPrice(productOrVariant: any, variant?: any): number {
  // Use centralized pricing utility for consistency
  return getProductPrice(productOrVariant, variant);
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