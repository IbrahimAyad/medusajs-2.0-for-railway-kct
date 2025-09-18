'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  fetchMedusaProducts, 
  isMedusaProductAvailable,
  getDefaultVariant,
  type MedusaProduct 
} from '@/services/medusaBackendService'
import { getProductPrice } from '@/utils/pricing'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { useUIStore } from '@/store/uiStore'
import { ShoppingBag, Filter, Grid2x2, Grid3x3, Search, Package, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function CatalogPage() {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const [gridView, setGridView] = useState<'2x2' | '3x3'>('3x3')
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high'>('name')
  const [mounted, setMounted] = useState(false)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())

  // Get cart context and UI store
  const { addItem, isLoading: cartLoading } = useMedusaCart()
  const { setIsCartOpen } = useUIStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadProducts()
    }
  }, [mounted])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      // First load only 40 products for faster initial render
      const medusaProducts = await fetchMedusaProducts()
      console.log('Loaded Medusa products:', medusaProducts.length)
      
      if (medusaProducts.length === 0) {
        setError('No products available. The catalog is being updated.')
      } else {
        // Show first 40 products immediately, rest will be from cache
        setProducts(medusaProducts.slice(0, 40))
        
        // Then update with all products if more than 40
        if (medusaProducts.length > 40) {
          setTimeout(() => {
            setProducts(medusaProducts)
          }, 100)
        }
      }
    } catch (err: any) {
      setError('Unable to load products. Please try again later.')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent, product: MedusaProduct) => {
    e.preventDefault() // Prevent Link navigation
    e.stopPropagation()
    
    const variant = getDefaultVariant(product)
    if (!variant) {
      toast.error('This product is not available')
      return
    }

    setAddingToCart(product.id)
    
    try {
      await addItem(variant.id, 1, product)
      
      // Show success state
      setAddedItems(prev => new Set([...prev, product.id]))
      toast.success(`${product.title} added to cart!`)
      
      // Open cart drawer
      setIsCartOpen(true)
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setAddedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(product.id)
          return newSet
        })
      }, 2000)
      
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add item to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  // Get unique pricing tiers
  const uniqueTiers = Array.from(new Set(
    products.map(p => p.metadata?.pricing_tier).filter(Boolean)
  ))

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      if (searchTerm && !product.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      // Tier filter
      if (selectedTier !== 'all' && product.metadata?.pricing_tier !== selectedTier) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          const priceA = parseFloat(getProductPrice(a?.variants?.[0])) || 0
          const priceB = parseFloat(getProductPrice(b?.variants?.[0])) || 0
          return priceA - priceB
        case 'price-high':
          const priceHighA = parseFloat(getProductPrice(a?.variants?.[0])) || 0
          const priceHighB = parseFloat(getProductPrice(b?.variants?.[0])) || 0
          return priceHighB - priceHighA
        case 'name':
        default:
          return a.title.localeCompare(b.title)
      }
    })

  const gridClass = gridView === '2x2' 
    ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-2">Loading Catalog</h2>
          <p className="text-gray-600">Fetching products from inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white rounded-lg shadow-lg p-8">
          <Package className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Catalog Notice</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="flex gap-3">
            <Button onClick={loadProducts} className="flex-1">Try Again</Button>
            <Link href="/products/suits" className="flex-1">
              <Button variant="outline" className="w-full">View Premium Collection</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Extended Catalog</h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredProducts.length} of {products.length} products
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGridView('2x2')}
                className={`p-2 rounded ${gridView === '2x2' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                aria-label="Large grid view"
              >
                <Grid2x2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setGridView('3x3')}
                className={`p-2 rounded ${gridView === '3x3' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                aria-label="Small grid view"
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>

            {/* Tier Filter */}
            {uniqueTiers.length > 0 && (
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              >
                <option value="all">All Tiers</option>
                {uniqueTiers.map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
            >
              <option value="name">Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-4`}>
            {filteredProducts.map((product) => {
              const defaultVariant = getDefaultVariant(product)
              const price = parseFloat(getProductPrice(defaultVariant)) || 0
              const isAvailable = isMedusaProductAvailable(product)
              const isAdding = addingToCart === product.id
              const isAdded = addedItems.has(product.id)
              
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
                >
                  <Link href={`/products/${product.handle || product.id}`}>
                    {/* Image */}
                    <div className="relative aspect-[3/4] bg-gray-100">
                      {product.thumbnail ? (
                        <Image
                          src={product.thumbnail}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes={gridView === '2x2' ? '(max-width: 768px) 50vw, 25vw' : '(max-width: 768px) 50vw, 16vw'}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      
                      {/* Out of Stock Badge */}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-white text-black px-3 py-1 rounded-full text-sm font-medium">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {/* Tier Badge */}
                      {product.metadata?.pricing_tier && (
                        <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                          {product.metadata.pricing_tier}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <h3 className={`font-medium mb-1 line-clamp-2 ${gridView === '3x3' ? 'text-sm' : 'text-base'}`}>
                        {product.title}
                      </h3>
                      
                      {price > 0 ? (
                        <p className={`font-bold ${gridView === '3x3' ? 'text-sm' : 'text-lg'}`}>
                          ${price.toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500">Price on request</p>
                      )}
                      
                      {/* Variants Count */}
                      {product.variants && product.variants.length > 1 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {product.variants.length} options available
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Add to Cart Button */}
                  {isAvailable && price > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={isAdding || cartLoading}
                        className={`
                          p-2 rounded-full transition-all duration-200 shadow-lg
                          ${isAdded 
                            ? 'bg-green-500 text-white' 
                            : 'bg-burgundy-600 hover:bg-burgundy-700 text-white'
                          }
                          ${(isAdding || cartLoading) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={isAdded ? 'Added!' : 'Add to Cart'}
                      >
                        {isAdded ? (
                          <Check className="h-4 w-4" />
                        ) : isAdding ? (
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-burgundy-50 border-t border-burgundy-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-burgundy-800">
            <strong>Note:</strong> This is our extended catalog from inventory. 
            For our premium collection of suits, ties, and dress shirts, visit the{' '}
            <Link href="/products/suits" className="underline font-medium">
              Premium Collection
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}