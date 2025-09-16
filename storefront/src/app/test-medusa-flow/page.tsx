'use client'

import { useEffect, useState } from 'react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { fetchMedusaProducts } from '@/services/medusaBackendService'
import { Button } from '@/components/ui/button'
import { Package, ShoppingCart, ArrowRight, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TestMedusaFlowPage() {
  const { cart, cartId, addItem, removeItem, isLoading, error, getSubtotal } = useMedusaCart()
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [testResults, setTestResults] = useState<any[]>([])
  
  useEffect(() => {
    loadProducts()
  }, [])
  
  const loadProducts = async () => {
    try {
      const data = await fetchMedusaProducts()
      // Filter to only show products with variants
      const productsWithVariants = data.filter(p => p.variants && p.variants.length > 0)
      setProducts(productsWithVariants.slice(0, 3)) // Show first 3 for testing
      setLoadingProducts(false)
    } catch (error) {
      console.error('Failed to load products:', error)
      setLoadingProducts(false)
    }
  }
  
  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setTestResults(prev => [...prev, { name: testName, status: 'running' }])
    try {
      await testFn()
      setTestResults(prev => prev.map(r => 
        r.name === testName ? { ...r, status: 'passed' } : r
      ))
    } catch (error) {
      setTestResults(prev => prev.map(r => 
        r.name === testName ? { ...r, status: 'failed', error: error } : r
      ))
    }
  }
  
  const testAddToCart = async () => {
    if (products.length === 0) throw new Error('No products available')
    const product = products[0]
    if (!product.variants || product.variants.length === 0) {
      throw new Error('Product has no variants')
    }
    await addItem(product.variants[0].id, 1)
  }
  
  const testRemoveFromCart = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty')
    }
    await removeItem(cart.items[0].id)
  }
  
  const runAllTests = async () => {
    setTestResults([])
    await runTest('Add to Cart', testAddToCart)
    await new Promise(r => setTimeout(r, 1000)) // Wait a bit
    await runTest('Remove from Cart', testRemoveFromCart)
  }
  
  if (loadingProducts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-burgundy-600" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Medusa Integration Test</h1>
        
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Automated Tests</h2>
          <Button onClick={runAllTests} className="mb-4">
            Run All Tests
          </Button>
          
          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((result, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-gray-50">
                  {result.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {result.status === 'passed' && <Check className="h-4 w-4 text-green-600" />}
                  {result.status === 'failed' && <span className="text-red-600">✗</span>}
                  <span className={
                    result.status === 'passed' ? 'text-green-600' :
                    result.status === 'failed' ? 'text-red-600' : ''
                  }>
                    {result.name}
                    {result.error && <span className="text-xs ml-2">({result.error.message})</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Cart Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Cart Status</h2>
          <div className="space-y-2 text-sm">
            <p>Cart ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{cartId || 'Not created'}</span></p>
            <p>Items: <span className="font-semibold">{cart?.items?.length || 0}</span></p>
            <p>Subtotal: <span className="font-semibold">${getSubtotal().toFixed(2)}</span></p>
            {error && <p className="text-red-600">Error: {error}</p>}
          </div>
          
          {cart && cart.items && cart.items.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Cart Items:</h3>
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Manual Testing */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Manual Testing</h2>
          
          {/* Test Products */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {products.map(product => (
              <div key={product.id} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{product.title}</h3>
                {product.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                )}
                {product.variants && product.variants[0] && (
                  <>
                    <p className="text-sm text-gray-600 mb-3">
                      Variant: {product.variants[0].title}
                    </p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => addItem(product.variants[0].id, 1)}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {/* Navigation Links */}
          <div className="flex gap-4">
            <Link href="/shop/catalog">
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Go to Catalog
              </Button>
            </Link>
            
            {cart && cart.items && cart.items.length > 0 && (
              <Link href="/checkout/medusa">
                <Button>
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-2">Test Flow:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Run All Tests" to verify basic cart operations</li>
            <li>Manually add products to cart using the buttons</li>
            <li>Check that cart updates correctly</li>
            <li>Click "Proceed to Checkout" to test the checkout flow</li>
            <li>Fill in test shipping information</li>
            <li>Use Stripe test card: 4242 4242 4242 4242</li>
            <li>Complete the order and verify success page</li>
          </ol>
        </div>
      </div>
    </div>
  )
}