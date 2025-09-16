'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface MedusaCartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MedusaCartDrawer({ isOpen, onClose }: MedusaCartDrawerProps) {
  const { cart, loading, updateQuantity, removeFromCart, itemCount } = useMedusaCart()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

  const handleUpdateQuantity = async (lineId: string, quantity: number) => {
    setUpdatingItems(prev => new Set(prev).add(lineId))
    await updateQuantity(lineId, quantity)
    setUpdatingItems(prev => {
      const next = new Set(prev)
      next.delete(lineId)
      return next
    })
  }

  const handleRemoveItem = async (lineId: string) => {
    setUpdatingItems(prev => new Set(prev).add(lineId))
    await removeFromCart(lineId)
    setUpdatingItems(prev => {
      const next = new Set(prev)
      next.delete(lineId)
      return next
    })
  }

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="text-lg font-medium">Shopping Cart</h2>
                {itemCount > 0 && (
                  <span className="text-sm text-gray-500">({itemCount} items)</span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {!cart || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg mb-2">Your cart is empty</p>
                  <p className="text-sm text-gray-500 mb-6 text-center">
                    Add some items to your cart to continue shopping
                  </p>
                  <Link
                    href="/collections"
                    onClick={onClose}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cart.items.map((item: any) => {
                    const isUpdating = updatingItems.has(item.id)
                    
                    return (
                      <div
                        key={item.id}
                        className={`flex gap-4 p-3 bg-gray-50 rounded-lg ${
                          isUpdating ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        {/* Product Image */}
                        {item.variant?.product?.thumbnail && (
                          <img
                            src={item.variant.product.thumbnail}
                            alt={item.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        )}
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                          {item.variant?.title && (
                            <p className="text-xs text-gray-500 mb-2">{item.variant.title}</p>
                          )}
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={isUpdating || item.quantity <= 1}
                              className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={isUpdating}
                              className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Price and Remove */}
                        <div className="flex flex-col items-end justify-between">
                          <p className="text-sm font-medium">
                            {formatPrice(item.unit_price * item.quantity)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdating}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  {cart.shipping_total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{formatPrice(cart.shipping_total)}</span>
                    </div>
                  )}
                  {cart.tax_total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax</span>
                      <span>{formatPrice(cart.tax_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href="/checkout-medusa"
                    onClick={onClose}
                    className="block w-full bg-black text-white py-3 rounded-lg text-center hover:bg-gray-800 transition-colors"
                  >
                    Checkout
                  </Link>
                  <button
                    onClick={onClose}
                    className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}