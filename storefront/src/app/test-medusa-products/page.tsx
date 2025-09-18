'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchMedusaProducts, type MedusaProduct } from '@/services/medusaBackendService'
import { Package, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

export default function TestMedusaProductsPage() {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await fetchMedusaProducts()
      setProducts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl">Loading Medusa Products...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Products</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medusa Products Test Page</h1>
          <p className="text-gray-600">
            Found {products.length} products from Medusa backend
          </p>
        </div>

        <div className="grid gap-4">
          {products.slice(0, 10).map((product, index) => (
            <div key={product.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                    <h3 className="text-lg font-semibold">{product.title}</h3>
                    {product.variants && product.variants.length > 0 && (
                      <CheckCircle className="h-4 w-4 text-green-500" title="Has variants" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Handle:</span>
                      <p className="font-mono text-xs">{product.handle}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <p className="font-semibold">
                        {product.price ? `$${product.price}` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Pricing Tier:</span>
                      <p>{product.pricing_tier || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Variants:</span>
                      <p>{product.variants?.length || 0}</p>
                    </div>
                  </div>

                  {product.variants && product.variants.length > 0 && (
                    <div className="bg-gray-50 rounded p-3 mb-4">
                      <p className="text-sm font-medium mb-2">Variants:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.slice(0, 5).map(variant => (
                          <span key={variant.id} className="px-2 py-1 bg-white rounded text-xs">
                            {variant.title} 
                            {variant.inventory_quantity !== undefined && (
                              <span className={variant.inventory_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                                {' '}({variant.inventory_quantity})
                              </span>
                            )}
                          </span>
                        ))}
                        {product.variants.length > 5 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{product.variants.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/products/${product.handle}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-burgundy-600 text-white rounded hover:bg-burgundy-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Product Detail Page
                    </Link>
                    <Link
                      href="/shop/catalog"
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      View in Catalog
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length > 10 && (
          <div className="mt-6 text-center text-gray-600">
            Showing first 10 of {products.length} products
          </div>
        )}

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Results</h2>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              API Connection: Success
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Products Loaded: {products.length}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Product Detail Links: Generated
            </li>
            <li className="flex items-center gap-2">
              {products.some(p => p.variants && p.variants.length > 0) ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              Variants Available: {products.some(p => p.variants && p.variants.length > 0) ? 'Yes' : 'No'}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}