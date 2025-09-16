import { useState, useEffect, useCallback } from 'react'
import { cartAdapter } from '@/lib/medusa/cart-adapter'
import { useCartStore } from '@/lib/store/cartStore'
import { Product } from '@/lib/types'

export function useMedusaCart() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [medusaCart, setMedusaCart] = useState<any>(null)

  // Get Zustand store
  const zustandCart = useCartStore()

  // Initialize Medusa cart on mount
  useEffect(() => {
    const initCart = async () => {
      try {
        setIsLoading(true)
        const cart = await cartAdapter.initialize()
        setMedusaCart(cart)
        setIsInitialized(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize cart')
      } finally {
        setIsLoading(false)
      }
    }

    initCart()
  }, [])

  // Add item to cart
  const addItem = useCallback(async (product: Product, size: string, quantity: number = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.addItem(product, size, quantity)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add item'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remove item from cart
  const removeItem = useCallback(async (lineItemId: string, productId?: string, size?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.removeItem(lineItemId, productId, size)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove item'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update quantity
  const updateQuantity = useCallback(async (
    lineItemId: string, 
    quantity: number, 
    productId?: string, 
    size?: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.updateQuantity(lineItemId, quantity, productId, size)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update quantity'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.clearCart()
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sync from Zustand to Medusa
  const syncFromZustand = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.syncFromZustand()
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to sync cart'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh cart from server
  const refreshCart = useCallback(async () => {
    try {
      setIsLoading(true)
      const cart = await cartAdapter.initialize()
      setMedusaCart(cart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh cart')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set customer email
  const setCustomerEmail = useCallback(async (email: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.setCustomerEmail(email)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set email'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set shipping address
  const setShippingAddress = useCallback(async (address: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
    phone?: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.setShippingAddress(address)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set shipping address'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Set billing address
  const setBillingAddress = useCallback(async (address: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.setBillingAddress(address)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set billing address'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get shipping options
  const getShippingOptions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const options = await cartAdapter.getShippingOptions()
      
      return { success: true, options }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get shipping options'
      setError(errorMsg)
      return { success: false, error: errorMsg, options: [] }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Add shipping method
  const addShippingMethod = useCallback(async (shippingOptionId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await cartAdapter.addShippingMethod(shippingOptionId)
      setMedusaCart(updatedCart)
      
      return { success: true, cart: updatedCart }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add shipping method'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get payment providers
  const getPaymentProviders = useCallback(async () => {
    try {
      setError(null)
      
      const result = await cartAdapter.getPaymentProviders()
      
      if (!result.success) {
        setError(result.error || 'Failed to get payment providers')
      }
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get payment providers'
      setError(errorMsg)
      return { success: false, error: errorMsg, providers: [] }
    }
  }, [])

  // Initialize payment session
  const initializePaymentSession = useCallback(async (providerId: string = 'pp_stripe_stripe') => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await cartAdapter.initializePaymentSession(providerId)
      
      if (!result.success) {
        setError(result.error || 'Failed to initialize payment session')
      }
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize payment session'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Complete checkout
  const completeCheckout = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await cartAdapter.completeCheckout()
      
      if (result.success) {
        // Clear local state as well
        setMedusaCart(null)
      } else {
        setError(result.error || 'Failed to complete checkout')
      }
      
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to complete checkout'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // State
    isInitialized,
    isLoading,
    error,
    medusaCart,
    zustandCart: zustandCart.items,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    syncFromZustand,
    refreshCart,
    
    // Checkout actions
    setCustomerEmail,
    setShippingAddress,
    setBillingAddress,
    getShippingOptions,
    addShippingMethod,
    getPaymentProviders,
    initializePaymentSession,
    completeCheckout,
    
    // Cart info
    itemCount: medusaCart?.items?.length || 0,
    subtotal: medusaCart?.subtotal || 0,
    total: medusaCart?.total || 0,
    shipping_total: medusaCart?.shipping_total || 0,
    tax_total: medusaCart?.tax_total || 0,
  }
}