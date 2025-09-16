import { medusa, MEDUSA_CONFIG } from './client'
import { useCartStore } from '@/lib/store/cartStore'
import { Product } from '@/lib/types'

interface MedusaCart {
  id: string
  region_id: string
  items: Array<{
    id: string
    variant_id: string
    quantity: number
    product: any
    variant: any
  }>
  total: number
  subtotal: number
  shipping_total: number
  tax_total: number
}

export class CartAdapter {
  private medusaCartId: string | null = null
  private medusaCart: MedusaCart | null = null

  constructor() {
    // Initialize from localStorage if exists
    if (typeof window !== 'undefined') {
      this.medusaCartId = localStorage.getItem('medusa_cart_id')
    }
  }

  /**
   * Initialize or retrieve Medusa cart
   */
  async initialize(): Promise<MedusaCart> {
    try {
      // Try to retrieve existing cart
      if (this.medusaCartId) {
        try {
          const response = await medusa.store.cart.retrieve(this.medusaCartId)
          
          if (!response || !response.cart) {
            throw new Error('Invalid cart response')
          }
          
          this.medusaCart = response.cart as unknown as MedusaCart
          return this.medusaCart
        } catch (error) {
          // DISABLED: Cart deletion moved to after order confirmation - cart not found, create new one
          // this.medusaCartId = null
          // localStorage.removeItem('medusa_cart_id')
        }
      }

      // Create new cart if needed with correct region for KCT products
      if (!this.medusaCartId) {
        const response = await medusa.store.cart.create({
          region_id: MEDUSA_CONFIG.regionId, // US region for KCT products
          sales_channel_id: MEDUSA_CONFIG.salesChannelId,
          // Optional: Include currency to ensure USD pricing
          currency_code: "usd"
        })
        
        if (!response || !response.cart) {
          throw new Error('Failed to create cart - invalid response')
        }
        
        this.medusaCart = response.cart as unknown as MedusaCart
        this.medusaCartId = this.medusaCart.id
        
        // Persist cart ID
        if (typeof window !== 'undefined') {
          localStorage.setItem('medusa_cart_id', this.medusaCartId)
        }
      }

      return this.medusaCart!
    } catch (error) {
      console.error('Failed to initialize cart:', error)
      throw error
    }
  }

  /**
   * Add item to both Zustand and Medusa carts
   */
  async addItem(product: Product, variantIdOrSize: string, quantity: number = 1) {
    try {
      // Ensure cart exists
      if (!this.medusaCartId) {
        await this.initialize()
        
        // Check again after initialization
        if (!this.medusaCartId) {
          throw new Error('Failed to initialize cart - no cart ID available')
        }
      }

      let variantId = variantIdOrSize
      let sizeForZustand = variantIdOrSize
      
      // Check if this is already a variant ID (contains "var" or looks like an ID)
      // Variant IDs can be like "var_xxx" or "variant_xxx" or just short IDs
      const isVariantId = variantIdOrSize.includes('var') || 
                          variantIdOrSize.includes('-') ||
                          variantIdOrSize.length > 10
      
      if (!isVariantId) {
        // It's a size name, try to find the variant
        const variant = await this.findVariantBySize(product.id, variantIdOrSize)
        if (!variant) {
          throw new Error(`Size ${variantIdOrSize} not available for this product`)
        }
        variantId = variant.id
      } else {
        // If we got a variant ID, we need to find the size name for Zustand
        try {
          const { product: fullProduct } = await medusa.store.product.retrieve(product.id, {
            fields: "*variants",
          })
          const variant = fullProduct.variants?.find((v: any) => v.id === variantId)
          if (variant) {
            sizeForZustand = variant.title // This should be the size like "L", "M", etc.
          }
        } catch (error) {
          console.warn('Could not find size name for variant:', variantId)
        }
      }

      // Add to Medusa cart using variant ID directly
      // SDK v2 uses createLineItem method
      const { cart: updatedCart } = await medusa.store.cart.createLineItem(
        this.medusaCartId!,
        {
          variant_id: variantId,
          quantity,
        }
      )
      
      this.medusaCart = updatedCart as unknown as MedusaCart

      // Also add to Zustand for immediate UI update with the correct size name
      // Don't override price - let backend handle it
      const cartStore = useCartStore.getState()
      cartStore.addItem(product, sizeForZustand, quantity)

      return this.medusaCart
    } catch (error) {
      console.error('Failed to add item:', error)
      throw error
    }
  }

  /**
   * Remove item from both carts
   */
  async removeItem(lineItemId: string, productId?: string, size?: string) {
    try {
      if (!this.medusaCartId) {
        throw new Error('No cart initialized')
      }

      // Remove from Medusa (SDK v2 method)
      const { cart: updatedCart, parent } = await medusa.store.cart.deleteLineItem(
        this.medusaCartId,
        lineItemId
      )

      this.medusaCart = updatedCart as unknown as MedusaCart

      // Remove from Zustand if product info provided
      if (productId && size) {
        const cartStore = useCartStore.getState()
        cartStore.removeItem(productId, size)
      }

      return this.medusaCart
    } catch (error) {
      console.error('Failed to remove item:', error)
      throw error
    }
  }

  /**
   * Update item quantity
   */
  async updateQuantity(lineItemId: string, quantity: number, productId?: string, size?: string) {
    try {
      if (!this.medusaCartId) {
        throw new Error('No cart initialized')
      }

      // Update in Medusa (SDK v2 method)
      const { cart: updatedCart } = await medusa.store.cart.updateLineItem(
        this.medusaCartId,
        lineItemId,
        { quantity }
      )

      this.medusaCart = updatedCart as unknown as MedusaCart

      // Update in Zustand if product info provided
      if (productId && size) {
        const cartStore = useCartStore.getState()
        cartStore.updateQuantity(productId, size, quantity)
      }

      return this.medusaCart
    } catch (error) {
      console.error('Failed to update quantity:', error)
      throw error
    }
  }

  /**
   * Sync Zustand cart to Medusa (for migration)
   */
  async syncFromZustand() {
    try {
      await this.initialize()
      
      const cartStore = useCartStore.getState()
      const zustandItems = cartStore.items

      // Clear Medusa cart first if it has items
      if (this.medusaCart?.items?.length) {
        for (const item of this.medusaCart.items) {
          await this.removeItem(item.id)
        }
      }

      // Add all Zustand items to Medusa
      for (const item of zustandItems) {
        try {
          // We need to get the actual product to find variant
          await this.addItem(
            { id: item.productId, name: item.name, price: item.price } as Product,
            item.size,
            item.quantity
          )
        } catch (error) {
          console.error(`Failed to sync item ${item.productId}:`, error)
        }
      }

      return this.medusaCart
    } catch (error) {
      console.error('Failed to sync cart:', error)
      throw error
    }
  }

  /**
   * Find variant by size
   */
  private async findVariantBySize(productId: string, size: string) {
    try {
      const { product } = await medusa.store.product.retrieve(productId, {
        fields: "*variants",
        region_id: MEDUSA_CONFIG.regionId // Include region to get correct pricing
      })

      // Find variant matching the size
      // Menswear sizes like "40R", "42L", etc.
      const variant = product.variants?.find((v: any) => 
        v.title === size || 
        v.options?.some((opt: any) => opt.value === size)
      )

      return variant
    } catch (error) {
      console.error('Failed to find variant:', error)
      return null
    }
  }

  /**
   * Get current cart
   */
  getCart() {
    return this.medusaCart
  }

  /**
   * Clear cart - DISABLED during webhook fix
   */
  async clearCart() {
    // DISABLED: Cart deletion moved to after order confirmation
    // try {
    //   // Clear Medusa cart by removing all items
    //   if (this.medusaCart?.items?.length) {
    //     for (const item of this.medusaCart.items) {
    //       await this.removeItem(item.id)
    //     }
    //   }

    //   // Clear Zustand
    //   const cartStore = useCartStore.getState()
    //   cartStore.clearCart()

    //   return this.medusaCart
    // } catch (error) {
    //   console.error('Failed to clear cart:', error)
    //   throw error
    // }
    console.log('clearCart() called but disabled to prevent webhook issues')
    return this.medusaCart
  }

  /**
   * Add customer email to cart
   */
  async setCustomerEmail(email: string) {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const { cart: updatedCart } = await medusa.store.cart.update(this.medusaCartId, {
      email,
    })

    this.medusaCart = updatedCart as unknown as MedusaCart
    return this.medusaCart
  }

  /**
   * Add shipping address
   */
  async setShippingAddress(address: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
    phone?: string
  }) {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const { cart: updatedCart } = await medusa.store.cart.update(this.medusaCartId, {
      shipping_address: address,
    })

    this.medusaCart = updatedCart as unknown as MedusaCart
    return this.medusaCart
  }

  /**
   * Add billing address
   */
  async setBillingAddress(address: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
  }) {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const { cart: updatedCart } = await medusa.store.cart.update(this.medusaCartId, {
      billing_address: address,
    })

    this.medusaCart = updatedCart as unknown as MedusaCart
    return this.medusaCart
  }

  /**
   * Add shipping method to cart
   */
  async addShippingMethod(shippingOptionId: string) {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const { cart: updatedCart } = await medusa.store.cart.addShippingMethod(
      this.medusaCartId,
      {
        option_id: shippingOptionId,
      }
    )

    this.medusaCart = updatedCart as unknown as MedusaCart
    return this.medusaCart
  }

  /**
   * Get available shipping options for the cart
   */
  async getShippingOptions() {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    const shippingOptions = await medusa.store.fulfillment.listCartOptions({ cart_id: this.medusaCartId })
    return shippingOptions
  }

  /**
   * Initialize payment session
   */
  async initializePaymentSession(providerId: string = 'pp_stripe_stripe') {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    try {
      // First retrieve the cart object
      const { cart } = await medusa.store.cart.retrieve(this.medusaCartId)
      
      if (!cart) {
        throw new Error('Cart not found')
      }
      
      // Initialize payment session with specified provider - pass cart object
      const paymentCollection = await medusa.store.payment.initiatePaymentSession(
        cart,
        {
          provider_id: providerId,
        }
      )

      return {
        success: true,
        paymentCollection,
        clientSecret: paymentCollection.payment_sessions?.find(
          (session: any) => session.provider_id === providerId
        )?.data?.client_secret,
        paymentSessionId: paymentCollection.payment_sessions?.find(
          (session: any) => session.provider_id === providerId
        )?.id,
      }
    } catch (error) {
      console.error('Failed to initialize payment session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize payment session',
      }
    }
  }

  /**
   * Get available payment providers
   */
  async getPaymentProviders() {
    try {
      console.log('Getting payment providers for region:', MEDUSA_CONFIG.regionId)
      
      // Get payment providers with required region_id parameter
      const providers = await medusa.store.payment.listPaymentProviders({
        region_id: MEDUSA_CONFIG.regionId
      })
      
      console.log('Payment providers response:', providers)
      
      return {
        success: true,
        providers: providers?.payment_providers || [],
        raw: providers, // Include raw response for debugging
      }
    } catch (error) {
      console.error('Failed to get payment providers:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment providers',
        providers: [],
      }
    }
  }

  /**
   * Complete the cart and create an order
   */
  async completeCheckout() {
    if (!this.medusaCartId) {
      throw new Error('No cart initialized')
    }

    try {
      const result = await medusa.store.cart.complete(this.medusaCartId)
      
      // DISABLED: Cart deletion moved to after order confirmation
      // if (result.order?.id) {
      //   // Clear Zustand
      //   const cartStore = useCartStore.getState()
      //   cartStore.clearCart()
      //   
      //   // Clear Medusa cart ID from storage
      //   if (typeof window !== 'undefined') {
      //     localStorage.removeItem('medusa_cart_id')
      //   }

      //   // Reset internal state
      //   this.medusaCart = null
      //   this.medusaCartId = null
      // }

      return {
        success: true,
        order: result.order,
        orderId: result.order?.id,
      }
    } catch (error) {
      console.error('Failed to complete checkout:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete checkout',
      }
    }
  }
}

// Singleton instance
export const cartAdapter = new CartAdapter()