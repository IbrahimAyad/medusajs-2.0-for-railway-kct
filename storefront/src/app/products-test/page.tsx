'use client'

import { useState, useEffect } from 'react'
import { medusa } from '@/lib/medusa/client'
import { useMedusaCart } from '@/hooks/useMedusaCart'

interface Product {
  id: string
  title: string
  description?: string
  thumbnail?: string
  handle: string
  variants?: Array<{
    id: string
    title: string
    sku?: string
    inventory_quantity?: number
    prices?: Array<{
      amount: number
      currency_code: string
    }>
  }>
  collection?: {
    title: string
    handle: string
  }
  type?: {
    value: string
  }
}

export default function ProductsTestPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  
  const { addItem, medusaCart, isLoading: cartLoading, refreshCart } = useMedusaCart()

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch products with variants
      const response = await medusa.store.product.list({
        limit: 50,
        fields: "*variants,*collection,*type,*tags,*images"
      })
      
      console.log('Products fetched:', response.products)
      setProducts(response.products as Product[])
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (product: Product, variantId: string) => {
    try {
      const variant = product.variants?.find(v => v.id === variantId)
      if (!variant) {
        alert('Please select a variant')
        return
      }

      // Create a product object compatible with our cart
      const productForCart = {
        id: product.id,
        name: product.title,
        price: variant.prices?.[0]?.amount || 0, // Price in dollars (Medusa 2.0)
        images: [product.thumbnail || ''],
      }

      // Pass variant ID - cart adapter will handle it
      const result = await addItem(productForCart as any, variantId, 1)
      
      if (result.success) {
        alert(`Added ${product.title} (${variant.title}) to cart!`)
        // Refresh cart to update the UI
        await refreshCart()
      } else {
        alert(`Failed to add: ${result.error}`)
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('Failed to add to cart')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl font-semibold animate-pulse">Loading products...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Error Loading Products</h2>
            <p>{error}</p>
            <button 
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medusa Products Test</h1>
          <p className="text-gray-600">
            Found {products.length} products | Cart Items: {medusaCart?.items?.length || 0}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image */}
              {product.thumbnail && (
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  <img 
                    src={product.thumbnail} 
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{product.title}</h3>
                
                {/* Meta Info */}
                <div className="text-xs text-gray-500 mb-2 space-y-1">
                  <div>ID: {product.id}</div>
                  <div>Handle: {product.handle}</div>
                  {product.type && <div>Type: {product.type.value}</div>}
                  {product.collection && <div>Collection: {product.collection.title}</div>}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">
                      Select Size/Variant ({product.variants.length} options)
                    </label>
                    <select 
                      className="w-full p-2 border rounded text-sm"
                      value={selectedVariants[product.id] || ''}
                      onChange={(e) => setSelectedVariants(prev => ({
                        ...prev,
                        [product.id]: e.target.value
                      }))}
                    >
                      <option value="">Choose variant...</option>
                      {product.variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.title} 
                          {variant.sku && ` (${variant.sku})`}
                          {variant.prices?.[0] && ` - $${(variant.prices[0].amount).toFixed(2)}`}
                          {variant.inventory_quantity !== undefined && ` [${variant.inventory_quantity} in stock]`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(product, selectedVariants[product.id])}
                  disabled={!selectedVariants[product.id] || cartLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {cartLoading ? 'Adding...' : 'Add to Cart'}
                </button>

                {/* Debug Info */}
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify({
                      id: product.id,
                      variants: product.variants?.map(v => ({
                        id: v.id,
                        title: v.title,
                        sku: v.sku
                      }))
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Status */}
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="font-semibold mb-2">Cart Status</h4>
          <p className="text-sm">Items: {medusaCart?.items?.length || 0}</p>
          <p className="text-sm">Total: ${((medusaCart?.total || 0) / 100).toFixed(2)}</p>
          {medusaCart?.items?.length > 0 && (
            <div className="mt-2 text-xs">
              {medusaCart.items.map((item: any) => (
                <div key={item.id}>
                  {item.quantity}x {item.variant?.product?.title || item.title || 'Item'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}