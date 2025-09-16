'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import medusaClient, { MEDUSA_REGION_ID } from '@/lib/medusa-client'

interface CartItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  variant: {
    id: string
    title: string
    product: {
      title: string
      thumbnail?: string
    }
  }
}

interface Cart {
  id: string
  email?: string
  items: CartItem[]
  region_id: string
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  total: number
  shipping_address?: any
  billing_address?: any
  payment_sessions?: any[]
  payment_session?: any
}

interface CartContextType {
  cart: Cart | null
  loading: boolean
  error: string | null
  itemCount: number
  addToCart: (variantId: string, quantity?: number) => Promise<void>
  updateQuantity: (lineId: string, quantity: number) => Promise<void>
  removeFromCart: (lineId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  setEmail: (email: string) => Promise<void>
  setAddresses: (shipping: any, billing?: any) => Promise<void>
  createPaymentSessions: () => Promise<void>
  setPaymentSession: (providerId: string) => Promise<void>
  completeCart: () => Promise<any>
}

const CartContext = createContext<CartContextType | null>(null)

export function MedusaCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cartId, setCartId] = useState<string | null>(null)

  // Calculate item count
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCartId = localStorage.getItem('medusa_cart_id')
    if (storedCartId) {
      setCartId(storedCartId)
      fetchCart(storedCartId)
    }
  }, [])

  const fetchCart = async (id: string) => {
    try {
      const response = await medusaClient.carts.retrieve(id)
      setCart(response.cart as any)
      return response.cart
    } catch (error) {
      console.error('Cart fetch error:', error)
      // DISABLED: Cart deletion moved to after order confirmation - cart might be completed or invalid
      // localStorage.removeItem('medusa_cart_id')
      // setCartId(null)
      // setCart(null)
      return null
    }
  }

  const createCart = async () => {
    setLoading(true)
    try {
      const response = await medusaClient.carts.create({
        region_id: MEDUSA_REGION_ID,
      })
      const newCart = response.cart as any
      localStorage.setItem('medusa_cart_id', newCart.id)
      setCartId(newCart.id)
      setCart(newCart)
      return newCart
    } catch (error) {
      console.error('Failed to create cart:', error)
      setError('Failed to create cart')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (variantId: string, quantity: number = 1) => {
    setLoading(true)
    setError(null)

    try {
      let currentCart = cart
      let currentCartId = cartId

      // Create cart if it doesn't exist
      if (!currentCart || !currentCartId) {
        currentCart = await createCart()
        currentCartId = currentCart.id
      }

      // Add line item to cart
      const response = await medusaClient.carts.lineItems.create(currentCartId, {
        variant_id: variantId,
        quantity: quantity,
      })

      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Add to cart failed:', error)
      setError(error.message || 'Failed to add to cart')

      // DISABLED: Cart deletion moved to after order confirmation
      // if (error.message?.includes('not found') || error.message?.includes('404')) {
      //   localStorage.removeItem('medusa_cart_id')
      //   setCartId(null)
      //   setCart(null)
      //   const newCart = await createCart()
      //   if (newCart) {
      //     return addToCart(variantId, quantity) // Retry with new cart
      //   }
      // }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (lineId: string, quantity: number) => {
    if (!cartId) return

    setLoading(true)
    setError(null)
    try {
      const response = await medusaClient.carts.lineItems.update(cartId, lineId, {
        quantity,
      })
      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Update quantity failed:', error)
      setError(error.message || 'Failed to update quantity')
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (lineId: string) => {
    if (!cartId) return

    setLoading(true)
    setError(null)
    try {
      const response = await medusaClient.carts.lineItems.delete(cartId, lineId)
      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Remove from cart failed:', error)
      setError(error.message || 'Failed to remove item')
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    // DISABLED: Cart deletion moved to after order confirmation
    // localStorage.removeItem('medusa_cart_id')
    // setCart(null)
    // setCartId(null)
    // setError(null)
    console.log('clearCart() called but disabled to prevent webhook issues')
  }

  const refreshCart = async () => {
    if (cartId) {
      await fetchCart(cartId)
    }
  }

  const setEmail = async (email: string) => {
    if (!cartId) return

    setLoading(true)
    try {
      const response = await medusaClient.carts.update(cartId, { email })
      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Set email failed:', error)
      setError(error.message || 'Failed to set email')
    } finally {
      setLoading(false)
    }
  }

  const setAddresses = async (shipping: any, billing?: any) => {
    if (!cartId) return

    setLoading(true)
    try {
      const response = await medusaClient.carts.update(cartId, {
        shipping_address: shipping,
        billing_address: billing || shipping,
      })
      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Set addresses failed:', error)
      setError(error.message || 'Failed to set addresses')
    } finally {
      setLoading(false)
    }
  }

  const createPaymentSessions = async () => {
    if (!cartId) return

    setLoading(true)
    try {
      const response = await medusaClient.carts.createPaymentSessions(cartId)
      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Create payment sessions failed:', error)
      setError(error.message || 'Failed to create payment sessions')
    } finally {
      setLoading(false)
    }
  }

  const setPaymentSession = async (providerId: string) => {
    if (!cartId) return

    setLoading(true)
    try {
      const response = await medusaClient.carts.setPaymentSession(cartId, {
        provider_id: providerId,
      })
      setCart(response.cart as any)
    } catch (error: any) {
      console.error('Set payment session failed:', error)
      setError(error.message || 'Failed to set payment session')
    } finally {
      setLoading(false)
    }
  }

  const completeCart = async () => {
    if (!cartId) return null

    setLoading(true)
    try {
      const response = await medusaClient.carts.complete(cartId)
      
      // DISABLED: Cart deletion moved to after order confirmation
      // if (response.type === 'order') {
      //   localStorage.removeItem('medusa_cart_id')
      //   setCart(null)
      //   setCartId(null)
      // }
      
      return response
    } catch (error: any) {
      console.error('Complete cart failed:', error)
      setError(error.message || 'Failed to complete order')
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      error,
      itemCount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart,
      setEmail,
      setAddresses,
      createPaymentSessions,
      setPaymentSession,
      completeCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useMedusaCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useMedusaCart must be used within MedusaCartProvider')
  }
  return context
}