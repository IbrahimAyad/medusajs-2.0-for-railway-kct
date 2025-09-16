'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import { fetchMedusaProductByHandle, fetchMedusaProducts, MedusaProduct, getDefaultVariant } from '@/services/medusaBackendService'
import { getProductPrice } from '@/utils/pricing'
import { findRelatedProducts, getComplementaryProducts } from '@/services/relatedProductsService'
import RelatedProducts from '@/components/products/RelatedProducts'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { AddToCartButton } from '@/components/cart/AddToCartButton'
import { ShoppingCart, Check, ChevronLeft, ChevronRight, Heart, Truck, Shield, Package } from 'lucide-react'
import Link from 'next/link'

function ProductDetailContent() {
  const params = useParams()
  const handle = params.handle as string
  
  const [product, setProduct] = useState<MedusaProduct | null>(null)
  const [allProducts, setAllProducts] = useState<MedusaProduct[]>([])
  const [relatedProducts, setRelatedProducts] = useState<MedusaProduct[]>([])
  const [complementaryProducts, setComplementaryProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (handle) {
      loadProduct()
    }
  }, [handle])

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch the product and all products for related items
      const [productData, allProductsData] = await Promise.all([
        fetchMedusaProductByHandle(handle),
        fetchMedusaProducts()
      ])
      
      if (productData) {
        setProduct(productData)
        setAllProducts(allProductsData)
        
        // Set default variant
        const defaultVar = getDefaultVariant(productData)
        if (defaultVar) {
          setSelectedVariant(defaultVar)
        }
        
        // Find related and complementary products
        const related = findRelatedProducts(productData, allProductsData, 8)
        const complementary = getComplementaryProducts(productData, allProductsData, 4)
        
        setRelatedProducts(related)
        setComplementaryProducts(complementary)
      } else {
        setError('Product not found')
      }
    } catch (err: any) {
      console.error('Error loading product:', err)
      setError('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const getColors = () => {
    const colors = product?.metadata?.colors as string
    if (!colors) return []
    return colors.split(',').map(c => c.trim()).filter(Boolean)
  }

  const getSizes = () => {
    // Get unique sizes from variants
    if (!product?.variants) return []
    const sizes = new Set(product.variants.map(v => v.title))
    return Array.from(sizes)
  }

  const getImages = () => {
    if (!product) return []
    const images = []
    
    if (product.thumbnail) {
      images.push(product.thumbnail)
    }
    
    if (product.images) {
      product.images.forEach(img => {
        if (img.url && !images.includes(img.url)) {
          images.push(img.url)
        }
      })
    }
    
    return images.length > 0 ? images : ['/placeholder.jpg']
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-light mb-4">{error || 'Product not found'}</h2>
          <Link href="/collections" className="text-sm underline">
            Back to Collections
          </Link>
        </div>
      </div>
    )
  }

  const images = getImages()
  const defaultVariant = getDefaultVariant(product)
  const price = parseFloat(getProductPrice(defaultVariant))
  const colors = getColors()
  const sizes = getSizes()

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/collections" className="text-sm text-gray-500 hover:text-black">
            Collections
          </Link>
          <span className="text-sm text-gray-500 mx-2">/</span>
          <span className="text-sm">{product.title}</span>
        </div>

        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden relative">
              <img
                src={images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === idx ? 'border-black' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-light mb-2">{product.title}</h1>
              <p className="text-2xl font-medium">${price}</p>
            </div>

            {product.description && (
              <p className="text-gray-600">{product.description}</p>
            )}

            {/* Color Selection */}
            {colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Color</h3>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        selectedColor === color
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Size</h3>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size)
                        const variant = product.variants?.find(v => v.title === size)
                        if (variant) setSelectedVariant(variant)
                      }}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        selectedSize === size
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quantity</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:border-black transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:border-black transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex gap-3">
              {selectedVariant ? (
                <AddToCartButton 
                  variantId={selectedVariant.id}
                  quantity={quantity}
                  className="flex-1"
                  size="lg"
                />
              ) : (
                <button 
                  disabled 
                  className="flex-1 py-3 px-6 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  Select Options
                </button>
              )}
              <button className="p-3 border border-gray-300 rounded-lg hover:border-black transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="w-5 h-5 text-gray-400" />
                <span>Free shipping on orders over $200</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-gray-400" />
                <span>30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Package className="w-5 h-5 text-gray-400" />
                <span>In stock, ready to ship</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <RelatedProducts 
            products={relatedProducts}
            title="You May Also Like"
            viewMode="carousel"
          />
        )}

        {/* Complementary Products */}
        {complementaryProducts.length > 0 && (
          <RelatedProducts 
            products={complementaryProducts}
            title="Complete the Look"
            viewMode="grid"
          />
        )}
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  )
}