'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  fetchMedusaProductByHandle, 
  getMedusaDisplayPrice,
  isMedusaProductAvailable,
  type MedusaProduct 
} from '@/services/medusaBackendService'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { getPrefetchedProduct } from '@/lib/products/navigation'
import { 
  ArrowLeft, Package, ShoppingBag, Check, 
  ChevronLeft, ChevronRight, Info, Truck,
  Shield, RefreshCw, Ruler, Star, Eye,
  Heart, Share2, ZoomIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Import our new components
import SizeGuideModal from '@/components/products/SizeGuideModal'
import ProductReviews from '@/components/products/ProductReviews'
import CompleteTheLook from '@/components/products/CompleteTheLook'
import TrustBadges, { StockUrgency, PaymentMethods } from '@/components/products/TrustBadges'

export default function EnhancedProductPage() {
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
  
  // New states for enhanced features
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showZoom, setShowZoom] = useState(false)
  const [viewCount] = useState(Math.floor(Math.random() * 20) + 5) // Simulated
  
  const handle = params.handle as string

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (handle && mounted) {
      // Try to get prefetched data first for instant display
      const prefetched = getPrefetchedProduct(handle)
      if (prefetched) {
        setProduct(prefetched)
        if (prefetched.variants?.length > 0) {
          setSelectedVariant(prefetched.variants[0])
        }
      }
      // Still load fresh data
      loadProduct()
    }
  }, [handle, mounted])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const data = await fetchMedusaProductByHandle(handle)
      
      if (data) {
        setProduct(data)
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0])
        }
      } else {
        toast.error('Product not found')
        router.push('/collections')
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
      toast.error('Please select a size')
      return
    }

    setAddingToCart(true)
    try {
      await addItem(selectedVariant.id, quantity, product || undefined)
      setAdded(true)
      toast.success('Added to cart!')
      setTimeout(() => setAdded(false), 3000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  if (!mounted) return null

  if (loading && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy-600" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">Product not found</h2>
          <Link href="/collections">
            <Button variant="outline">Browse Collections</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = product.images || []
  const currentImage = images[selectedImageIndex] || { url: product.thumbnail || '' }
  const isAvailable = selectedVariant ? isMedusaProductAvailable(selectedVariant) : false
  const price = selectedVariant ? getMedusaDisplayPrice(selectedVariant) : 0
  const stockQuantity = selectedVariant?.inventory_quantity || 0

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-black">Collections</Link>
          <span>/</span>
          <span className="text-black">{product.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <div 
              className="relative aspect-[3/4] overflow-hidden bg-gray-50 rounded-lg group cursor-zoom-in"
              onClick={() => setShowZoom(true)}
            >
              <Image
                src={currentImage.url || product.thumbnail || ''}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              
              {/* Zoom indicator */}
              <div className="absolute top-4 right-4 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5" />
              </div>
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage() }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage() }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
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
                      "relative w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all",
                      selectedImageIndex === index 
                        ? "border-black" 
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

          {/* Right: Product Info */}
          <div className="space-y-6">
            {/* Title, Price & Reviews */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-light">{product.title}</h1>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Heart className={cn(
                      "w-5 h-5",
                      isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"
                    )} />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Share2 className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              
              {/* Quick Reviews Summary */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">4.8 (47 reviews)</span>
              </div>
              
              {/* Price */}
              <div className="flex items-baseline gap-3">
                <p className="text-3xl font-light">${price.toFixed(2)}</p>
                {product.metadata?.compare_at_price && (
                  <p className="text-xl text-gray-400 line-through">
                    ${product.metadata.compare_at_price}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Urgency */}
            <StockUrgency quantity={stockQuantity} viewCount={viewCount} />

            {/* Description */}
            {product.description && (
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700">{product.description}</p>
              </div>
            )}

            {/* Size Selection with Size Guide */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">
                    Select Size
                  </label>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center gap-1 text-sm text-burgundy-600 hover:text-burgundy-700"
                  >
                    <Ruler className="w-4 h-4" />
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.inventory_quantity === 0}
                      className={cn(
                        "py-3 px-4 border rounded-lg transition-all",
                        selectedVariant?.id === variant.id 
                          ? "border-black bg-black text-white" 
                          : "border-gray-300 hover:border-gray-400",
                        variant.inventory_quantity === 0 && "opacity-50 cursor-not-allowed line-through"
                      )}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border rounded-lg hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                  className="w-10 h-10 border rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isAvailable || addingToCart}
                className="w-full h-14 text-base"
                size="lg"
              >
                {addingToCart ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Adding...
                  </span>
                ) : added ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Added to Cart
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Add to Cart
                  </span>
                )}
              </Button>
              
              <Button variant="outline" className="w-full h-14 text-base" size="lg">
                Buy Now
              </Button>
            </div>

            {/* Trust Badges */}
            <TrustBadges compact className="pt-6 border-t" />
            
            {/* Payment Methods */}
            <PaymentMethods />

            {/* Product Details Accordion */}
            <div className="space-y-4 pt-6 border-t">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <span className="font-medium">Product Details</span>
                  <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="pt-3 text-sm text-gray-600 space-y-2">
                  <p>• Premium wool blend fabric</p>
                  <p>• Modern fit with slight taper</p>
                  <p>• Fully lined jacket</p>
                  <p>• Interior pockets</p>
                  <p>• Dry clean only</p>
                </div>
              </details>
              
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer py-2">
                  <span className="font-medium">Shipping & Returns</span>
                  <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="pt-3 text-sm text-gray-600 space-y-2">
                  <p>• Free shipping on orders over $199</p>
                  <p>• Express shipping available</p>
                  <p>• 30-day return policy</p>
                  <p>• Free exchanges on different sizes</p>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* Complete the Look Section */}
        <CompleteTheLook 
          currentProduct={{
            id: product.id,
            title: product.title,
            price: price
          }}
        />

        {/* Reviews Section */}
        <ProductReviews 
          productId={product.id}
          productName={product.title}
        />
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal 
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />
    </div>
  )
}