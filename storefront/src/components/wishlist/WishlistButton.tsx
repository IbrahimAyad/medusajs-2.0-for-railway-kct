'use client'

import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import { MedusaProduct } from '@/services/medusaBackendService'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface WishlistButtonProps {
  product: MedusaProduct
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export default function WishlistButton({ 
  product, 
  size = 'md',
  showLabel = false,
  className = ''
}: WishlistButtonProps) {
  const { toggleItem, isInWishlist } = useWishlistStore()
  const [isAnimating, setIsAnimating] = useState(false)
  const isWishlisted = isInWishlist(product.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsAnimating(true)
    toggleItem(product)
    
    setTimeout(() => setIsAnimating(false), 300)
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  }

  return (
    <button
      onClick={handleClick}
      className={`relative group transition-all ${buttonSizeClasses[size]} ${className}`}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isWishlisted ? 'filled' : 'empty'}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heart
            className={`${sizeClasses[size]} transition-colors ${
              isWishlisted 
                ? 'fill-red-500 text-red-500' 
                : 'text-gray-400 hover:text-red-500 group-hover:text-red-500'
            }`}
          />
        </motion.div>
      </AnimatePresence>

      {/* Ripple effect */}
      {isAnimating && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-full h-full bg-red-500 rounded-full" />
        </motion.div>
      )}

      {/* Label */}
      {showLabel && (
        <span className="ml-2 text-sm">
          {isWishlisted ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  )
}