'use client'

import { useMedusaCart } from '@/contexts/MedusaCartContext'
import Link from 'next/link'

export default function MedusaCartPage() {
  const { cart, isLoading, updateQuantity, removeItem, clearCart } = useMedusaCart()

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  const isEmpty = !cart || cart.items.length === 0

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {isEmpty ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link
              href="/shop-new"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            <div className="lg:col-span-7">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <ul className="divide-y divide-gray-200">
                  {cart.items.map((item) => (
                    <li key={item.id} className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md">
                          {item.thumbnail && (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-md"
                            />
                          )}
                        </div>
                        
                        <div className="ml-6 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {item.title}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {formatPrice(item.unit_price)}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="mt-4 flex items-center">
                            <label htmlFor={`quantity-${item.id}`} className="sr-only">
                              Quantity
                            </label>
                            <select
                              id={`quantity-${item.id}`}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              className="rounded-md border border-gray-300 text-base"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={clearCart}
                className="mt-4 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear cart
              </button>
            </div>

            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                
                <dl className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Subtotal</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatPrice(cart.subtotal || 0)}
                    </dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Shipping</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatPrice(cart.shipping_total || 0)}
                    </dd>
                  </div>
                  
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Taxes</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {formatPrice(cart.tax_total || 0)}
                    </dd>
                  </div>
                  
                  <div className="border-t pt-4 flex justify-between">
                    <dt className="text-base font-medium text-gray-900">Total</dt>
                    <dd className="text-base font-medium text-gray-900">
                      {formatPrice(cart.total || 0)}
                    </dd>
                  </div>
                </dl>
                
                <div className="mt-6 space-y-3">
                  <Link
                    href="/checkout-new"
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-black hover:bg-gray-800"
                  >
                    Proceed to Checkout
                  </Link>
                  
                  <Link
                    href="/shop-new"
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}