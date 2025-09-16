'use client'

import { useState, useEffect } from 'react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import medusaClient from '@/lib/medusa-client'
import { CartIndicator } from '@/components/cart/CartIndicator'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { Check, ShoppingCart, Package } from 'lucide-react'
import Link from 'next/link'

export default function TestMedusaIntegration() {
  const { cart, loading: cartLoading, error: cartError, itemCount } = useMedusaCart()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    testMedusaIntegration()
  }, [])

  const testMedusaIntegration = async () => {
    const results = []
    
    // Test 1: Medusa Client Connection
    try {
      const health = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'}/health`)
      results.push({
        test: 'Backend Connection',
        status: health.ok ? 'success' : 'error',
        message: health.ok ? 'Connected to Medusa backend' : `Failed: ${health.status}`
      })
    } catch (error) {
      results.push({
        test: 'Backend Connection',
        status: 'error',
        message: 'Cannot reach backend'
      })
    }

    // Test 2: Fetch Products
    try {
      const response = await medusaClient.products.list({ limit: 10 })
      setProducts(response.products || [])
      results.push({
        test: 'Fetch Products',
        status: 'success',
        message: `Found ${response.products?.length || 0} products`
      })
    } catch (error: any) {
      results.push({
        test: 'Fetch Products',
        status: 'error',
        message: error.message
      })
    }

    // Test 3: Cart Context
    results.push({
      test: 'Cart Context',
      status: cart ? 'success' : 'warning',
      message: cart ? `Cart ID: ${cart.id}` : 'No cart created yet'
    })

    // Test 4: Stripe Configuration
    results.push({
      test: 'Stripe Key',
      status: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'success' : 'warning',
      message: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'Stripe key configured' : 'Using default Stripe key'
    })

    setTestResults(results)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Medusa v2 Integration Test</h1>
              <p className="text-gray-600">Testing cart, checkout, and Stripe integration</p>
            </div>
            <CartIndicator />
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Integration Status</h2>
          <div className="space-y-3">
            {testResults.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="font-medium">{result.test}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{result.message}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Info */}
        {cart && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Cart Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cart ID</p>
                <p className="font-mono text-xs">{cart.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Items</p>
                <p className="font-semibold">{itemCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-semibold">${(cart.subtotal / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="font-semibold">${(cart.total / 100).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Products */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Products</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 6).map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  {product.thumbnail && (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="font-medium mb-1">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    ${((product.variants?.[0]?.prices?.[0]?.amount || 0) / 100).toFixed(2)}
                  </p>
                  {product.variants && product.variants.length > 0 ? (
                    <AddToCartButton
                      variantId={product.variants[0].id}
                      className="w-full"
                      size="sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No variants available</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No products found</p>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/collections"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Browse Collections
            </Link>
            <Link
              href="/checkout-medusa"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Test Checkout
            </Link>
            <button
              onClick={testMedusaIntegration}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Rerun Tests
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}