'use client'

import { useWishlistStore } from '@/store/wishlistStore'
import Link from 'next/link'
import { Heart, ShoppingCart, X } from 'lucide-react'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDefaultVariant } from '@/services/medusaBackendService'
import { getProductPrice } from '@/utils/pricing'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem } = useMedusaCart()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addedToCart, setAddedToCart] = useState<string[]>([])

  const handleAddToCart = async (productId: string) => {
    const item = items.find(i => i.id === productId)
    if (!item) return

    const variant = getDefaultVariant(item.product)
    if (!variant) return

    setAddingToCart(productId)
    try {
      await addItem(variant.id, 1)
      setAddedToCart([...addedToCart, productId])
      setTimeout(() => {
        setAddedToCart(prev => prev.filter(id => id !== productId))
      }, 3000)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(null)
    }
  }

  const getPrice = (item: any) => {
    const variant = getDefaultVariant(item.product)
    return parseFloat(getProductPrice(variant))
  }

  const getColors = (item: any) => {
    const colors = item.product.metadata?.colors as string
    if (!colors) return []
    return colors.split(',').map((c: string) => c.trim()).filter(Boolean)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h1 className="text-3xl font-light mb-4">Your Wishlist is Empty</h1>
            <p className="text-gray-600 mb-8">
              Save your favorite items here to purchase later
            </p>
            <Link
              href="/collections"
              className="inline-block px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light mb-2">My Wishlist</h1>
            <p className="text-gray-600">
              {items.length} item{items.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative"
              >
                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Product Link */}
                <Link href={`/product/${item.product.handle || item.product.id}`}>
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                    {item.product.thumbnail ? (
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="space-y-2">
                  <Link href={`/product/${item.product.handle || item.product.id}`}>
                    <h3 className="text-sm font-medium line-clamp-2 hover:underline">
                      {item.product.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">${getPrice(item)}</span>
                    {getColors(item).length > 0 && (
                      <span className="text-xs text-gray-500">
                        {getColors(item).length} colors
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(item.id)}
                    disabled={addingToCart === item.id}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      addedToCart.includes(item.id)
                        ? 'bg-green-600 text-white'
                        : 'bg-black text-white hover:bg-gray-800'
                    } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                  >
                    {addedToCart.includes(item.id) ? (
                      'Added!'
                    ) : addingToCart === item.id ? (
                      'Adding...'
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>

                {/* Added Date */}
                <p className="text-xs text-gray-400 mt-2">
                  Added {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}