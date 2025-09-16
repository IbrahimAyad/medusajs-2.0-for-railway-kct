'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  createMedusaCart, 
  addToMedusaCart, 
  updateMedusaCartItem,
  removeFromMedusaCart,
  getMedusaCart,
  type MedusaCart as MedusaCartType,
  type MedusaProduct
} from '@/services/medusaBackendService'
import { useLocalStorage } from '@/hooks/useClientSideStorage'

interface MedusaCartContextType {
  cart: MedusaCartType | null
  cartId: string | null
  isLoading: boolean
  error: string | null
  
  // Cart operations
  initializeCart: (email?: string) => Promise<void>
  addItem: (variantId: string, quantity?: number, product?: MedusaProduct) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clearCart: () => void
  refreshCart: () => Promise<void>
  resetCart: () => Promise<void>  // New: Force reset cart when in bad state
  
  // Helpers
  getItemCount: () => number
  getSubtotal: () => number
}

const MedusaCartContext = createContext<MedusaCartContextType | undefined>(undefined)

export function MedusaCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<MedusaCartType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use the custom hook for safe localStorage access
  const [cartId, setCartId, mounted] = useLocalStorage<string | null>('medusa_cart_id', null)

  // Load cart after mount when we have a cart ID
  useEffect(() => {
    if (mounted && cartId) {
      refreshCartById(cartId)
    }
  }, [mounted, cartId])

  const refreshCartById = async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const cartData = await getMedusaCart(id)
      if (cartData) {
        setCart(cartData)
      } else {
        // Cart might be expired or invalid
        console.log('Cart not found, clearing stored ID')
        setCartId(null)
        setCart(null)
      }
    } catch (err) {
      console.error('Failed to refresh cart, creating new one:', err)
      // Clear invalid cart ID and reset state
      setCartId(null)
      setCart(null)
      setError(null) // Don't show error for expired carts
    } finally {
      setIsLoading(false)
    }
  }

  const initializeCart = async (email?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const newCart = await createMedusaCart(email)
      if (newCart) {
        setCart(newCart)
        setCartId(newCart.cart_id || newCart.id)
      } else {
        throw new Error('Failed to create cart')
      }
    } catch (err: any) {
      console.error('Failed to initialize cart:', err)
      setError(err.message || 'Failed to create cart')
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = async (variantId: string, quantity: number = 1, product?: MedusaProduct) => {
    try {
      setIsLoading(true)
      setError(null)
      
      let currentCartId = cartId
      
      // Create cart if it doesn't exist
      if (!currentCartId) {
        const newCart = await createMedusaCart()
        if (newCart) {
          currentCartId = newCart.cart_id || newCart.id
          setCartId(currentCartId)
          setCart(newCart)
        } else {
          throw new Error('Unable to create shopping cart. Please refresh and try again.')
        }
      }
      
      // Add item to cart
      const updatedCart = await addToMedusaCart(currentCartId, variantId, quantity)
      if (updatedCart) {
        setCart(updatedCart)
      } else {
        throw new Error('Unable to add item to cart. Please try again.')
      }
      
      // Show success toast/notification (could emit event here)
      console.log('Item added to cart successfully')
      
    } catch (err: any) {
      console.error('Failed to add item:', err)
      
      // Check for payment session error and reset cart if needed
      if (err.message?.includes('payment session') || err.message?.includes('Could not delete')) {
        console.log('Cart has bad payment sessions, creating new cart...')
        
        // Clear the bad cart
        setCartId(null)
        setCart(null)
        
        try {
          // Create a fresh cart
          const newCart = await createMedusaCart()
          if (newCart) {
            const newCartId = newCart.cart_id || newCart.id
            setCartId(newCartId)
            setCart(newCart)
            
            // Try adding the item to the new cart
            const updatedCart = await addToMedusaCart(newCartId, variantId, quantity)
            if (updatedCart) {
              setCart(updatedCart)
              console.log('Item added to new cart successfully')
              return // Success! Exit early
            }
          }
        } catch (retryErr: any) {
          console.error('Failed to create new cart and add item:', retryErr)
          setError('Unable to add item to cart. Please refresh the page and try again.')
          throw new Error('Unable to add item to cart. Please refresh the page and try again.')
        }
      }
      
      // Check if this is a payment session error that needs cart reset
      if (err.message === 'CART_PAYMENT_SESSION_ERROR') {
        console.log('Cart has stuck payment sessions. Creating new cart...')
        
        // DISABLED: Cart deletion moved to after order confirmation
        // localStorage.removeItem('medusa_cart_id')
        // setCartId(null)
        // setCart(null)
        
        // Try one more time with a fresh cart
        try {
          const newCartResponse = await createMedusaCart()
          if (newCartResponse) {
            const newCartId = newCartResponse.id
            setCartId(newCartId)
            localStorage.setItem('medusa_cart_id', newCartId)
            
            const updatedCart = await addToMedusaCart(newCartId, variantId, quantity)
            if (updatedCart) {
              setCart(updatedCart)
              setError(null)
              return // Success!
            }
          }
        } catch (finalErr: any) {
          console.error('Failed to recover from payment session error:', finalErr)
          setError('Cart system needs to be reset. Please refresh the page.')
          throw new Error('Cart system needs to be reset. Please refresh the page.')
        }
      }
      
      // Provide user-friendly error messages
      let userMessage = 'Unable to add item to cart. Please try again.'
      
      if (err.message?.includes('strategy') || err.message?.includes('payment')) {
        userMessage = 'Cart system is being updated. Please try again in a moment.'
      } else if (err.message?.includes('500') || err.message?.includes('server')) {
        userMessage = 'Our servers are experiencing issues. Please try again shortly.'
      } else if (err.message?.includes('network')) {
        userMessage = 'Connection error. Please check your internet and try again.'
      } else if (err.message && err.message !== 'CART_PAYMENT_SESSION_ERROR') {
        userMessage = err.message
      }
      
      setError(userMessage)
      
      // Throw error for toast notifications
      throw new Error(userMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!cartId) {
      setError('No cart found')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }
      
      const updatedCart = await updateMedusaCartItem(cartId, itemId, quantity)
      if (updatedCart) {
        setCart(updatedCart)
      }
    } catch (err: any) {
      console.error('Failed to update quantity:', err)
      setError(err.message || 'Failed to update quantity')
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!cartId) {
      setError('No cart found')
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedCart = await removeFromMedusaCart(cartId, itemId)
      if (updatedCart) {
        setCart(updatedCart)
      }
    } catch (err: any) {
      console.error('Failed to remove item:', err)
      setError(err.message || 'Failed to remove item')
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = () => {
    // DISABLED: Cart deletion moved to after order confirmation
    // setCart(null)
    // setCartId(null)
    // setError(null)
    console.log('clearCart() called but disabled to prevent webhook issues')
  }

  const refreshCart = async () => {
    if (cartId) {
      await refreshCartById(cartId)
    }
  }

  const resetCart = async () => {
    console.log('Resetting cart due to bad state...')
    
    // Clear the current cart completely
    setCart(null)
    setCartId(null)
    setError(null)
    
    // Create a fresh new cart
    try {
      setIsLoading(true)
      const newCart = await createMedusaCart()
      if (newCart) {
        const newCartId = newCart.cart_id || newCart.id
        setCartId(newCartId)
        setCart(newCart)
        console.log('Cart reset successful, new cart ID:', newCartId)
      }
    } catch (err: any) {
      console.error('Failed to reset cart:', err)
      setError('Failed to reset cart. Please refresh the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const getItemCount = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getSubtotal = () => {
    if (!cart?.items) return 0
    return cart.items.reduce((total, item) => {
      return total + (item.unit_price * item.quantity)
    }, 0)
  }

  return (
    <MedusaCartContext.Provider
      value={{
        cart,
        cartId,
        isLoading,
        error,
        initializeCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        resetCart,
        getItemCount,
        getSubtotal
      }}
    >
      {children}
    </MedusaCartContext.Provider>
  )
}

export function useMedusaCart() {
  const context = useContext(MedusaCartContext)
  if (!context) {
    throw new Error('useMedusaCart must be used within MedusaCartProvider')
  }
  return context
}