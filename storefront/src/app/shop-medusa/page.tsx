'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, AlertCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { medusa } from '@/lib/medusa/client'

export default function ShopMedusaPage() {
  const router = useRouter()
  const { medusaCart, addItem, isLoading: cartLoading, refreshCart } = useMedusaCart()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    refreshCart() // Make sure cart is initialized
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch products with all their variants and prices
      // IMPORTANT: Include region_id to get KCT products with correct pricing
      const response = await medusa.store.product.list({
        limit: 20,
        fields: "*variants,*variants.prices,*images",
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"
      })
      
      console.log('Fetched products:', response)
      
      if (response.products && response.products.length > 0) {
        setProducts(response.products)
      } else {
        setError('No products found in the backend')
      }
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError(err?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleVariantSelect = (productId: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantId
    }))
  }

  const handleAddToCart = async (product: any) => {
    const variantId = selectedVariants[product.id]
    
    if (!variantId) {
      setError('Please select a variant/size')
      setTimeout(() => setError(null), 3000)
      return
    }

    setAddingToCart(product.id)
    setError(null)

    try {
      // Find the selected variant
      const variant = product.variants.find((v: any) => v.id === variantId)
      
      if (!variant) {
        throw new Error('Variant not found')
      }

      // Create a product object that matches our Product type
      const productData = {
        id: product.id,
        name: product.title,
        title: product.title,
        description: product.description,
        price: variant.prices?.[0]?.amount || 0,
        images: product.images?.map((img: any) => img.url) || [],
        category: product.collection?.title || 'General',
        variants: product.variants.map((v: any) => ({
          id: v.id,
          size: v.title || 'Default',
          stock: v.inventory_quantity || 10,
          price: v.prices?.[0]?.amount || 0
        })),
        slug: product.handle || product.id,
        inStock: true
      }

      // Add to cart using the variant ID
      const result = await addItem(productData, variantId, 1)

      if (result.success) {
        setAddSuccess(product.id)
        setTimeout(() => {
          setAddSuccess(null)
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to add to cart')
      }
    } catch (err: any) {
      console.error('Add to cart error:', err)
      setError(err?.message || 'Failed to add to cart')
      setTimeout(() => setError(null), 5000)
    } finally {
      setAddingToCart(null)
    }
  }

  const formatPrice = (amount: number) => {
    return `$${(amount).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading products from Medusa backend...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Shop Medusa Products</h1>
          <p className="text-gray-600 mb-4">
            Products from your live Medusa backend with Stripe Tax integration
          </p>
          
          {/* Cart Info */}
          {medusaCart && (
            <div className="inline-flex items-center gap-4 p-4 bg-white rounded-lg shadow">
              <div className="text-sm">
                <span className="font-medium">Cart ID:</span> {medusaCart.id}
              </div>
              <div className="text-sm">
                <span className="font-medium">Items:</span> {medusaCart.items?.length || 0}
              </div>
              {medusaCart.total > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Total:</span> {formatPrice(medusaCart.total)}
                </div>
              )}
              <Link
                href="/cart"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                View Cart
              </Link>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Products Available</h2>
            <p className="text-gray-600 mb-6">
              Please add products in your Medusa admin panel
            </p>
            <a
              href="https://backend-production-7441.up.railway.app/app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Admin Panel
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Product Image */}
                <div className="relative h-64 bg-gray-100">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {product.description || 'No description available'}
                  </p>

                  {/* Variant Selector */}
                  {product.variants && product.variants.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">
                        Select Variant:
                      </label>
                      <select
                        value={selectedVariants[product.id] || ''}
                        onChange={(e) => handleVariantSelect(product.id, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose...</option>
                        {product.variants.map((variant: any) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.title || 'Default'} - {formatPrice(variant.prices?.[0]?.amount || 0)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    {product.variants?.[0]?.prices?.[0] && (
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(product.variants[0].prices[0].amount)}
                      </p>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCart === product.id || cartLoading}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {addingToCart === product.id ? (
                      'Adding...'
                    ) : addSuccess === product.id ? (
                      <>
                        <Check className="h-5 w-5" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">🎉 Stripe Tax Integration Active</h3>
          <p className="text-sm text-gray-700 mb-2">
            Your backend is configured with Stripe Tax for accurate US tax calculations.
          </p>
          <ul className="text-sm space-y-1 text-gray-600">
            <li>• State, county, and city taxes calculated automatically</li>
            <li>• Tax rates update when shipping address is provided</li>
            <li>• Full compliance with US tax jurisdictions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}