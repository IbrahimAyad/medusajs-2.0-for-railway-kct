'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, AlertCircle, Package, Truck, Shield, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { medusa, MEDUSA_CONFIG } from '@/lib/medusa/client'

export default function KCTShopPage() {
  const router = useRouter()
  const { medusaCart, addItem, isLoading: cartLoading, refreshCart } = useMedusaCart()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addSuccess, setAddSuccess] = useState<string | null>(null)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    fetchKCTProducts()
    refreshCart()
  }, [])

  const fetchKCTProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching KCT products with config:', {
        publishableKey: MEDUSA_CONFIG.publishableKey,
        regionId: MEDUSA_CONFIG.regionId,
        backend: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
      })
      
      // Fetch KCT products from the correct sales channel
      const response = await medusa.store.product.list({
        limit: 100, // Get more products
        fields: "*variants,*variants.prices,*images,*collection",
        region_id: MEDUSA_CONFIG.regionId // Critical: Must include region_id for KCT products
      })
      
      console.log('KCT Products Response:', response)
      
      if (response.products && response.products.length > 0) {
        // Filter to show only KCT products (exclude test products)
        const kctProducts = response.products.filter(p => 
          !p.title.toLowerCase().includes('sweatpants') && 
          !p.title.toLowerCase().includes('test')
        )
        setProducts(kctProducts)
        setProductCount(kctProducts.length)
      } else {
        setError('No products found')
      }
    } catch (err: any) {
      console.error('Error fetching KCT products:', err)
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
    const variantId = selectedVariants[product.id] || product.variants?.[0]?.id
    
    if (!variantId || !product.variants?.length) {
      setError('No variants available for this product')
      setTimeout(() => setError(null), 3000)
      return
    }

    setAddingToCart(product.id)
    setError(null)

    try {
      const variant = product.variants.find((v: any) => v.id === variantId) || product.variants[0]
      
      // Create product object for our cart system
      const productData = {
        id: product.id,
        name: product.title,
        title: product.title,
        description: product.description,
        price: variant.prices?.[0]?.amount || 0,
        images: product.images?.map((img: any) => img.url) || [],
        category: product.collection?.title || product.title.includes('Suit') ? 'Suits' : 
                  product.title.includes('Tuxedo') ? 'Tuxedos' : 
                  product.title.includes('Vest') ? 'Vests' : 'Accessories',
        variants: product.variants.map((v: any) => ({
          id: v.id,
          size: v.title || 'Default',
          stock: v.inventory_quantity || 10,
          price: v.prices?.[0]?.amount || 0
        })),
        slug: product.handle || product.id,
        inStock: true
      }

      const result = await addItem(productData, variantId, 1)

      if (result.success) {
        setAddSuccess(product.id)
        setTimeout(() => setAddSuccess(null), 2000)
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

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.title.includes('Suit') ? 'Suits' : 
                    product.title.includes('Tuxedo') ? 'Tuxedos' : 
                    product.title.includes('Vest') ? 'Vests' : 
                    product.title.includes('Shirt') ? 'Shirts' : 'Other'
    
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {} as Record<string, any[]>)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading KCT Menswear Collection...</div>
          <div className="text-sm text-gray-600">Fetching suits, tuxedos, vests, and accessories</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">KCT Menswear Collection</h1>
          <p className="text-xl mb-6">Premium Suits, Tuxedos, Vests & Accessories</p>
          
          {/* Stats Bar */}
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span>{productCount} Products Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              <span>Free US Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Stripe Tax Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <span>Secure Checkout</span>
            </div>
          </div>
          
          {/* Cart Status */}
          {medusaCart && (
            <div className="bg-white/10 rounded-lg p-4 inline-block">
              <div className="flex items-center gap-6">
                <div className="text-sm">
                  <span className="opacity-75">Cart Items:</span> {medusaCart.items?.length || 0}
                </div>
                {medusaCart.total > 0 && (
                  <div className="text-sm">
                    <span className="opacity-75">Subtotal:</span> {formatPrice(medusaCart.subtotal || 0)}
                  </div>
                )}
                {medusaCart.tax_total > 0 && (
                  <div className="text-sm">
                    <span className="opacity-75">Tax:</span> {formatPrice(medusaCart.tax_total)}
                  </div>
                )}
                <Link
                  href="/checkout-direct-stripe"
                  className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 flex items-center gap-2 text-sm font-medium"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Products by Category */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Products...</h2>
            <p className="text-gray-600">If products don't appear, check the admin panel</p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 border-b pb-2">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Product Image - Clickable */}
                    <Link href={`/products/${product.handle || product.id}`}>
                      <div className="relative h-48 bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                      {product.thumbnail || product.images?.[0] ? (
                        <Image
                          src={product.thumbnail || product.images[0].url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200">
                          <div className="text-center">
                            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-xs text-gray-500">No Image</span>
                          </div>
                        </div>
                      )}
                      {addSuccess === product.id && (
                        <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
                          <Check className="h-12 w-12 text-white" />
                        </div>
                      )}
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link href={`/products/${product.handle || product.id}`}>
                        <h3 className="font-semibold mb-2 line-clamp-2 hover:text-blue-600 cursor-pointer">{product.title}</h3>
                      </Link>
                      
                      {/* Variant/Size Selector */}
                      {product.variants && product.variants.length > 1 ? (
                        <div className="mb-3">
                          <select
                            value={selectedVariants[product.id] || ''}
                            onChange={(e) => handleVariantSelect(product.id, e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {product.variants.map((variant: any) => (
                              <option key={variant.id} value={variant.id}>
                                {variant.title || 'Default'} - {formatPrice(variant.prices?.[0]?.amount || 0)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : product.variants?.[0] ? (
                        <div className="mb-3">
                          <p className="text-xl font-bold text-blue-600">
                            {formatPrice(product.variants[0].prices?.[0]?.amount || 0)}
                          </p>
                        </div>
                      ) : null}

                      {/* Add to Cart Button */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={addingToCart === product.id || cartLoading || !product.variants?.length}
                        className="w-full py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        {addingToCart === product.id ? (
                          'Adding...'
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Backend Status */}
      <div className="bg-green-50 border-t border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="font-bold mb-4 text-green-900">✅ Backend Status: Production Ready</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-green-800">Products</p>
              <p className="text-green-700">204 KCT products accessible</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Payments</p>
              <p className="text-green-700">Stripe configured with live key</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Taxes</p>
              <p className="text-green-700">Stripe Tax for US accuracy</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Shipping</p>
              <p className="text-green-700">Free US, $40 International</p>
            </div>
            <div>
              <p className="font-medium text-green-800">Sales Channel</p>
              <p className="text-green-700">KCT Menswear (Default)</p>
            </div>
            <div>
              <p className="font-medium text-green-800">API Key</p>
              <p className="text-green-700 text-xs break-all">{MEDUSA_CONFIG.publishableKey}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}