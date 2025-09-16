'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { 
  fetchMedusaProductByHandle, 
  getMedusaDisplayPrice,
  isMedusaProductAvailable,
  type MedusaProduct 
} from '@/services/medusaBackendService'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { 
  ArrowLeft, Package, ShoppingBag, Check, 
  ChevronLeft, ChevronRight, Info, Truck,
  Shield, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Client-only component to avoid hydration issues
function ProductContent() {
  const params = useParams()
  const router = useRouter()
  const { addItem, isLoading: cartLoading } = useMedusaCart()
  
  const [product, setProduct] = useState<MedusaProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [added, setAdded] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const handle = params.handle as string

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (handle && mounted) {
      loadProduct()
    }
  }, [handle, mounted])

  const loadProduct = async () => {
    setLoading(true)
    try {
      // Fetch product by handle
      const data = await fetchMedusaProductByHandle(handle)
      
      if (data) {
        setProduct(data)
        // Select first variant by default
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
      } else {
        // Product not found
        toast.error('Product not found')
        router.push('/shop/catalog')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant')
      return
    }

    setAddingToCart(true)
    try {
      await addItem(selectedVariant.id, quantity)
      setAdded(true)
      toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`)
      
      // Reset after 2 seconds
      setTimeout(() => {
        setAdded(false)
        setQuantity(1)
      }, 2000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add item to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty)
    }
  }

  const nextImage = () => {
    if (product?.images && product.images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images!.length)
    }
  }

  const prevImage = () => {
    if (product?.images && product.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? product.images!.length - 1 : prev - 1
      )
    }
  }

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold">Loading Product...</h2>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <Link href="/shop/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get price from the product directly or from metadata
  const price = product.price || getMedusaDisplayPrice(product)
  const isAvailable = isMedusaProductAvailable(product)
  const images = product.images || []
  const currentImage = images[selectedImageIndex]?.url || product.thumbnail
  const pricingTier = product.pricing_tier || product.metadata?.pricing_tier

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link href="/shop/catalog" className="hover:text-gray-900">Catalog</Link>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-gray-300" />
                </div>
              )}
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Out of Stock Overlay */}
              {!isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white text-black px-6 py-2 rounded-full text-lg font-medium">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors",
                      selectedImageIndex === index 
                        ? "border-burgundy-600" 
                        : "border-gray-200 hover:border-gray-400"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.title} ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
              {pricingTier && (
                <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600 mb-4">
                  {pricingTier}
                </span>
              )}
              {price > 0 ? (
                <p className="text-2xl font-bold">${price.toFixed(2)}</p>
              ) : (
                <p className="text-xl text-gray-500">Price on request</p>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-gray max-w-none">
                <p>{product.description}</p>
              </div>
            )}

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {product.variants.length > 1 ? 'Select Size' : 'Size'}
                </label>
                <select
                  value={selectedVariant?.id || ''}
                  onChange={(e) => {
                    const variant = product.variants?.find(v => v.id === e.target.value)
                    setSelectedVariant(variant)
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                >
                  {product.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.title} 
                      {variant.inventory_quantity === 0 && ' (Out of Stock)'}
                      {variant.sku && ` - ${variant.sku}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Quantity</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                  className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable || addingToCart || cartLoading || !selectedVariant}
              className={cn(
                "w-full py-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
                added 
                  ? "bg-green-500 text-white" 
                  : isAvailable && selectedVariant
                    ? "bg-burgundy-600 hover:bg-burgundy-700 text-white" 
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
              )}
            >
              {added ? (
                <>
                  <Check className="h-5 w-5" />
                  Added to Cart!
                </>
              ) : addingToCart ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-5 w-5" />
                  {isAvailable && selectedVariant ? 'Add to Cart' : 'Select Size'}
                </>
              )}
            </button>

            {/* Product Features */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-gray-400" />
                <span>Free shipping on orders over $500</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RefreshCw className="h-5 w-5 text-gray-400" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-gray-400" />
                <span>Secure checkout with Stripe</span>
              </div>
            </div>

            {/* Additional Info */}
            {selectedVariant && (
              <div className="border-t pt-6">
                <h3 className="font-medium mb-3">Product Details</h3>
                <dl className="space-y-2 text-sm">
                  {selectedVariant.sku && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">SKU:</dt>
                      <dd className="font-medium">{selectedVariant.sku}</dd>
                    </div>
                  )}
                  {product.handle && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Style:</dt>
                      <dd className="font-medium">{product.handle}</dd>
                    </div>
                  )}
                  {selectedVariant.inventory_quantity !== undefined && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Availability:</dt>
                      <dd className="font-medium">
                        {selectedVariant.inventory_quantity > 0 
                          ? `${selectedVariant.inventory_quantity} in stock`
                          : 'Out of stock'}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back to Catalog */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t">
        <Link 
          href="/shop/catalog" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Link>
      </div>
    </div>
  )
}

// Export as default with no SSR to avoid hydration issues
export default function MedusaProductDetailPage() {
  return <ProductContent />
}