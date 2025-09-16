'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'

interface AddToCartButtonProps {
  variantId: string
  quantity?: number
  availableForSale?: boolean
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AddToCartButton({ 
  variantId,
  quantity = 1,
  availableForSale = true,
  className = '',
  showIcon = true,
  size = 'md'
}: AddToCartButtonProps) {
  const { addToCart, loading } = useMedusaCart()
  const [isAdding, setIsAdding] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleAddToCart = async () => {
    if (!variantId) return
    
    setIsAdding(true)
    try {
      await addToCart(variantId, quantity)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={!availableForSale || isAdding || loading || !variantId}
      className={`
        ${sizeClasses[size]}
        rounded-lg font-medium transition-all
        flex items-center justify-center gap-2
        ${availableForSale 
          ? success 
            ? 'bg-green-600 text-white' 
            : 'bg-black text-white hover:bg-gray-800'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }
        disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {showIcon && (
        success ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />
      )}
      {success ? 'Added!' : isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  )
}