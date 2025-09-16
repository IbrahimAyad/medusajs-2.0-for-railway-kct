'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { medusa, MEDUSA_CONFIG } from '@/lib/medusa/client'
import { ShoppingCart, Check, AlertCircle, ArrowLeft, Truck, Shield, Star, Package } from 'lucide-react'
import Link from 'next/link'
import { getAllCoreProducts } from '@/lib/config/coreProducts'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const handle = params.handle as string
  
  const { addItem, isLoading: cartLoading, medusaCart } = useMedusaCart()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (handle) {
      // Check if this is a core suit product first
      const coreProducts = getAllCoreProducts()
      const coreSuit = coreProducts.find(p => 
        p.id === handle || 
        p.stripePriceId === handle ||
        (p.category === 'suits' && (
          p.id === `suit-${handle}-2p` ||
          p.id === `suit-${handle}-3p` ||
          p.id.includes(handle)
        ))
      )
      
      if (coreSuit && coreSuit.category === 'suits') {
        // Extract color from suit ID and redirect
        const match = coreSuit.id.match(/suit-([^-]+)-/)
        if (match) {
          const color = match[1]
          router.replace(`/products/suits/${color}`)
          return
        }
      }
      
      // Otherwise, try to fetch as Medusa product
      fetchProduct()
    }
  }, [handle, router])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching product with handle:', handle)
      
      // Fetch the specific product by handle
      const response = await medusa.store.product.list({
        handle: handle,
        region_id: MEDUSA_CONFIG.regionId,
        fields: "*variants,*variants.prices,*images,*collection,*tags"
      })
      
      console.log('Product response:', response)
      
      if (response.products && response.products.length > 0) {
        const foundProduct = response.products[0]
        console.log('Product found:', foundProduct)
        console.log('First variant price:', foundProduct.variants?.[0]?.prices?.[0])
        setProduct(foundProduct)
        
        // Auto-select first available variant
        if (foundProduct.variants && foundProduct.variants.length > 0) {
          setSelectedVariant(foundProduct.variants[0].id)
        }
      } else {
        setError('Product not found')
      }
    } catch (err: any) {
      console.error('Error fetching product:', err)
      setError(err?.message || 'Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setError('Please select a size')
      return
    }

    setIsAdding(true)
    setError(null)
    setAddSuccess(false)

    try {
      const variant = product.variants.find((v: any) => v.id === selectedVariant)
      
      if (!variant) {
        throw new Error('Variant not found')
      }

      // Create product data for cart
      // Don't include price - let Medusa backend handle pricing
      const productData = {
        id: product.id,
        name: product.title,
        title: product.title,
        description: product.description,
        // Let Medusa backend determine the price
        price: 0, // Will be set by Medusa
        images: product.images?.map((img: any) => img.url) || [],
        category: product.collection?.title || 'General',
        variants: product.variants.map((v: any) => ({
          id: v.id,
          size: v.title || 'Default',
          stock: v.inventory_quantity || 10,
          // Don't set price here - Medusa will handle it
          price: 0
        })),
        slug: product.handle,
        inStock: true
      }

      const result = await addItem(productData, selectedVariant, quantity)

      if (result.success) {
        setAddSuccess(true)
        setTimeout(() => {
          setAddSuccess(false)
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to add to cart')
      }
    } catch (err: any) {
      console.error('Add to cart error:', err)
      setError(err?.message || 'Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    if (!error) {
      router.push('/checkout-direct-stripe')
    }
  }

  const formatPrice = (amount: number) => {
    // Medusa 2.0 returns amount in DOLLARS, not cents!
    console.log('Formatting price:', amount, '(already in dollars)')
    return `$${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">Loading product...</div>
          <div className="text-sm text-gray-600">Please wait</div>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-xl mb-2">Product Not Found</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/kct-shop" className="text-blue-600 hover:underline">
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  if (!product) return null

  const selectedVariantData = product.variants?.find((v: any) => v.id === selectedVariant)
  const currentPrice = selectedVariantData?.prices?.[0]?.amount || 0

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link href="/kct-shop" className="hover:text-gray-900">Shop</Link>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
              {(product.images && product.images.length > 0) || product.thumbnail ? (
                <>
                  <Image
                    src={(() => {
                      // Handle different image structures from Medusa
                      if (product.images && product.images[currentImageIndex]) {
                        const img = product.images[currentImageIndex]
                        return img.url || img.src || img
                      }
                      return product.thumbnail || '/placeholder-product.jpg'
                    })()}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/placeholder-product.jpg'
                    }}
                  />
                  {addSuccess && (
                    <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Check className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-xl font-semibold">Added to Cart!</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="h-20 w-20 text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square bg-gray-50 rounded overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-black' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image.url || image.src || image}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-product.jpg'
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              <p className="text-2xl font-semibold text-black">
                {formatPrice(currentPrice)}
              </p>
            </div>

            {product.description && (
              <p className="text-gray-600">
                {product.description}
              </p>
            )}

            {/* Size/Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Select Size
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {product.variants.map((variant: any) => {
                    const isOutOfStock = variant.inventory_quantity === 0
                    return (
                      <button
                        key={variant.id}
                        onClick={() => !isOutOfStock && setSelectedVariant(variant.id)}
                        disabled={isOutOfStock}
                        className={`
                          relative py-3 px-4 border rounded-lg text-sm font-medium transition-all
                          ${isOutOfStock 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                            : selectedVariant === variant.id
                            ? 'border-black bg-black text-white'
                            : 'border-gray-300 text-gray-900 hover:border-gray-400 bg-white'
                          }
                        `}
                      >
                        {variant.title || 'Default'}
                        {isOutOfStock && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="bg-gray-100 px-1">Out</span>
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || cartLoading || !selectedVariant}
                className="w-full py-3 px-6 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {isAdding ? (
                  'Adding...'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </button>
              
              {/* Buy Now Button */}
              <button
                onClick={async () => {
                  // Add to cart first, then go to checkout
                  await handleAddToCart()
                  setTimeout(() => {
                    if (!error) {
                      router.push('/checkout-stripe')
                    }
                  }, 500)
                }}
                disabled={isAdding || cartLoading || !selectedVariant}
                className="w-full py-3 px-6 bg-gold text-black rounded-lg hover:bg-gold/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium border-2 border-gold"
              >
                Buy Now
              </button>
            </div>

            {/* Cart Status */}
            {medusaCart && medusaCart.items?.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Cart:</span> {medusaCart.items.length} items
                  </div>
                  <Link
                    href="/checkout-direct-stripe"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Checkout →
                  </Link>
                </div>
              </div>
            )}

            {/* Product Features */}
            <div className="border-t pt-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4" />
                <span>Free shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4" />
                <span>Premium quality guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}