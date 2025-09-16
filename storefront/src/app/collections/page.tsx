'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  FILTER_OPTIONS, 
  filterProducts, 
  fetchProductsByCollection,
  getProductStock,
  sortProducts,
  type ActiveFilters,
  type SortOption,
  getProductCollections,
  getProductTags,
  formatTag,
  getColorHex
} from '@/services/medusaProductService'
import { fetchMedusaProducts, type MedusaProduct } from '@/services/medusaBackendService'
import { getProductPriceAsNumber } from '@/utils/pricing'
import { progressiveLoader } from '@/services/medusaProgressiveLoader'
import { Button } from '@/components/ui/button'
import { 
  Package, Filter, X, ChevronDown, Search, 
  ShoppingBag, Check, Grid3x3, Grid2x2, Heart,
  SlidersHorizontal, ArrowUpDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import WishlistButton from '@/components/wishlist/WishlistButton'
import { AddToCartButton } from '@/components/cart/AddToCartButton'

// Collection categories with images
const collections = [
  {
    id: 'suits-tuxedos',
    name: 'Suits & Tuxedos',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/navy/navy-main-2.jpg',
    description: 'Premium suits and formal tuxedos',
    icon: '🤵'
  },
  {
    id: 'wedding',
    name: 'Wedding Collection',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Spring%20Wedding%20Bundles/indigo-2p-white-dusty-pink.png',
    description: 'Perfect attire for your special day',
    icon: '💒'
  },
  {
    id: 'prom',
    name: 'Prom Collection',
    image: 'https://cdn.kctmenswear.com/blazers/prom/mens-red-floral-pattern-prom-blazer/front.webp',
    description: 'Stand out at your prom',
    icon: '🎉'
  },
  {
    id: 'accessories',
    name: 'Accessories',
    image: 'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Spring%20Wedding%20Bundles/dusty-sage-vest-tie.png',
    description: 'Vests, ties, bowties and more',
    icon: '👔'
  },
  {
    id: 'outerwear',
    name: 'Outerwear',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/9ac91a19-5951-43d4-6a98-c9d658765c00/public',
    description: 'Coats and jackets',
    icon: '🧥'
  },
  {
    id: 'footwear',
    name: 'Footwear',
    image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/7d203d2a-63b7-46d3-9749-1f203e4ccc00/public',
    description: 'Dress shoes and formal footwear',
    icon: '👞'
  }
]

function CollectionsContent() {
  const searchParams = useSearchParams()
  const collectionParam = searchParams.get('collection')
  
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(3)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [scrolled, setScrolled] = useState(false)
  
  // Active filters state
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    collection: collectionParam || undefined
  })
  
  // Handle scroll for header shrinking
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Load products
  useEffect(() => {
    loadProducts()
  }, [])
  
  // Apply filters when products or filters change
  useEffect(() => {
    const filtered = filterProducts(products, activeFilters)
    const sorted = sortProducts(filtered, sortBy)
    setFilteredProducts(sorted)
  }, [products, activeFilters, sortBy])
  
  const loadProducts = async () => {
    setLoading(true)
    try {
      console.time('[Collections] Initial load')
      progressiveLoader.reset()
      const result = await progressiveLoader.loadInitialBatch()
      setProducts(result.products)
      setHasMore(result.hasMore)
      console.timeEnd('[Collections] Initial load')
      
      // Preload next batch in background
      if (result.hasMore) {
        setTimeout(() => progressiveLoader.preloadNext(), 1000)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      console.time('[Collections] Load more')
      const result = await progressiveLoader.loadMore()
      const allProducts = progressiveLoader.getLoadedProducts()
      setProducts(allProducts)
      setHasMore(result.hasMore)
      console.timeEnd('[Collections] Load more')
      
      // Preload next batch
      if (result.hasMore) {
        setTimeout(() => progressiveLoader.preloadNext(), 1000)
      }
    } catch (error) {
      console.error('Failed to load more products:', error)
    } finally {
      setLoadingMore(false)
    }
  }
  
  const toggleColorFilter = (color: string) => {
    setActiveFilters(prev => {
      const colors = prev.colors || []
      if (colors.includes(color)) {
        return { ...prev, colors: colors.filter(c => c !== color) }
      }
      return { ...prev, colors: [...colors, color] }
    })
  }
  
  const clearAllFilters = () => {
    setActiveFilters({})
    setShowFilters(false)
    setShowMobileFilters(false)
  }
  
  const activeFilterCount = 
    (activeFilters.collection ? 1 : 0) +
    (activeFilters.colors?.length || 0) +
    (activeFilters.priceRange ? 1 : 0) +
    (activeFilters.occasion ? 1 : 0) +
    (activeFilters.style ? 1 : 0) +
    (activeFilters.inStock ? 1 : 0)
  
  // Get collection counts
  const getCollectionCount = (collectionId: string) => {
    return products.filter(p => {
      const collections = getProductCollections(p)
      return collections.includes(collectionId)
    }).length
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header with Collections */}
      <div className={cn(
        "sticky top-0 z-20 bg-white border-b transition-all duration-300",
        scrolled ? "shadow-lg" : ""
      )}>
        {/* Title Section */}
        <div className={cn(
          "transition-all duration-300",
          scrolled ? "py-2" : "py-6"
        )}>
          <div className="max-w-7xl mx-auto px-4">
            <h1 className={cn(
              "font-bold transition-all duration-300",
              scrolled ? "text-2xl" : "text-4xl"
            )}>
              Collections
            </h1>
            <p className={cn(
              "text-gray-600 transition-all duration-300",
              scrolled ? "hidden" : "mt-2"
            )}>
              Explore our premium collections of formal menswear
            </p>
          </div>
        </div>
        
        {/* Collection Cards */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          scrolled ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
        )}>
          <div className="max-w-7xl mx-auto px-4 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {collections.map(collection => {
                const count = getCollectionCount(collection.id)
                const isActive = activeFilters.collection === collection.id
                
                return (
                  <button
                    key={collection.id}
                    onClick={() => setActiveFilters(prev => ({
                      ...prev,
                      collection: isActive ? undefined : collection.id
                    }))}
                    className={cn(
                      "group relative rounded-xl overflow-hidden transition-all duration-300",
                      isActive ? "ring-2 ring-black scale-105" : "hover:scale-105"
                    )}
                  >
                    <div className="aspect-[3/4] relative">
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <div className="text-2xl mb-1">{collection.icon}</div>
                        <h3 className="font-semibold text-sm">{collection.name}</h3>
                        {count > 0 && (
                          <p className="text-xs opacity-90">{count} products</p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="border-t">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Desktop Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden md:flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-black text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              {/* Mobile Filters Toggle */}
              <button
                onClick={() => setShowMobileFilters(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-black text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              {/* Active Filters Pills */}
              {activeFilterCount > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  {activeFilters.collection && (
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                      {collections.find(c => c.id === activeFilters.collection)?.name}
                      <button
                        onClick={() => setActiveFilters(prev => ({ ...prev, collection: undefined }))}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {activeFilters.colors?.map(color => (
                    <span key={color} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1">
                      <span 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorHex(color.replace('color-', '')) }}
                      />
                      {formatTag(color)}
                      <button
                        onClick={() => toggleColorFilter(color)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600 hidden md:block">
                {filteredProducts.length} products
              </p>
              
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
              
              {/* Grid Size - Desktop Only */}
              <div className="hidden lg:flex items-center gap-2 border rounded-lg p-1">
                <button
                  onClick={() => setGridSize(2)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    gridSize === 2 ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                >
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridSize(3)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    gridSize === 3 ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setGridSize(4)}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    gridSize === 4 ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                >
                  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="3" height="3" />
                    <rect x="5" y="1" width="3" height="3" />
                    <rect x="9" y="1" width="3" height="3" />
                    <rect x="13" y="1" width="3" height="3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Desktop Filters Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden md:block flex-shrink-0 overflow-hidden"
            >
              <div className="w-64 sticky top-40">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-gray-600 hover:text-black"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  {/* Color Filter */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Color</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {FILTER_OPTIONS.colors.map(color => {
                        const colorName = color.value.replace('color-', '')
                        return (
                          <button
                            key={color.value}
                            onClick={() => toggleColorFilter(colorName)}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all",
                              activeFilters.colors?.includes(colorName)
                                ? "border-black scale-110"
                                : "border-gray-300 hover:border-gray-400"
                            )}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          />
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Price Range */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Price</h4>
                    <div className="space-y-2">
                      {FILTER_OPTIONS.priceRanges.map(range => (
                        <label key={range.value} className="flex items-center">
                          <input
                            type="radio"
                            name="price"
                            checked={activeFilters.priceRange === range.value}
                            onChange={() => setActiveFilters(prev => ({
                              ...prev,
                              priceRange: range.value
                            }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Occasion */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Occasion</h4>
                    <div className="flex flex-wrap gap-2">
                      {FILTER_OPTIONS.occasions.map(occasion => (
                        <button
                          key={occasion.value}
                          onClick={() => setActiveFilters(prev => ({
                            ...prev,
                            occasion: occasion.value === prev.occasion ? undefined : occasion.value
                          }))}
                          className={cn(
                            "px-3 py-1 rounded-full text-sm transition-colors",
                            activeFilters.occasion === occasion.value
                              ? "bg-black text-white"
                              : "bg-gray-100 hover:bg-gray-200"
                          )}
                        >
                          {occasion.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Style */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Style</h4>
                    <div className="space-y-2">
                      {FILTER_OPTIONS.styles.map(style => (
                        <label key={style.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={activeFilters.style === style.value}
                            onChange={() => setActiveFilters(prev => ({
                              ...prev,
                              style: style.value === prev.style ? undefined : style.value
                            }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{style.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* In Stock */}
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={activeFilters.inStock || false}
                        onChange={(e) => setActiveFilters(prev => ({
                          ...prev,
                          inStock: e.target.checked
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm">In Stock Only</span>
                    </label>
                  </div>
                  
                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-sm rounded transition-colors"
                    >
                      Clear All Filters ({activeFilterCount})
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        
        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters</p>
              <Button onClick={clearAllFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className={cn(
              "grid gap-4",
              gridSize === 2 && "grid-cols-2",
              gridSize === 3 && "grid-cols-2 md:grid-cols-3",
              gridSize === 4 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            )}>
              {filteredProducts.map((product, index) => {
                const stock = getProductStock(product)
                const collections = getProductCollections(product)
                const tags = getProductTags(product)
                const colorTag = tags.find(t => t.startsWith('color-'))
                const color = colorTag?.replace('color-', '')
                
                // Priority loading for first 8 images (above the fold)
                const isAboveTheFold = index < 8
                
                return (
                  <Link 
                    key={product.id} 
                    href={`/products/medusa/${product.handle}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className="relative aspect-[3/4] bg-gray-100">
                        {product.thumbnail && (
                          <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={isAboveTheFold}
                            loading={isAboveTheFold ? 'eager' : 'lazy'}
                          />
                        )}
                        
                        {/* Wishlist Button */}
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full">
                            <WishlistButton product={product} size="sm" />
                          </div>
                        </div>
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {collections.includes('wedding') && (
                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                              Wedding
                            </span>
                          )}
                          {collections.includes('prom') && (
                            <span className="bg-pink-600 text-white text-xs px-2 py-1 rounded">
                              Prom
                            </span>
                          )}
                          {!stock.inStock && (
                            <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                              Out of Stock
                            </span>
                          )}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {product.variants && product.variants.length > 0 ? (
                            <AddToCartButton 
                              variantId={product.variants[0].id}
                              className="flex-1"
                              size="sm"
                            />
                          ) : (
                            <button className="flex-1 bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed">
                              No Variants
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-medium text-sm mb-1 line-clamp-2">
                          {product.title}
                        </h3>
                        
                        {/* Color indicator */}
                        {color && (
                          <div className="flex items-center gap-2 mb-2">
                            <span 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: getColorHex(color) }}
                            />
                            <span className="text-xs text-gray-600">
                              {formatTag(color)}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-lg font-semibold">
                          ${getProductPriceAsNumber(product).toFixed(2)}
                        </p>
                        
                        {stock.inStock && stock.totalQuantity <= 5 && (
                          <p className="text-xs text-red-600 mt-1">
                            {stock.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          
          {/* Load More Button */}
          {!loading && hasMore && filteredProducts.length > 0 && (
            <div className="flex justify-center mt-12 mb-8">
              <Button 
                onClick={loadMoreProducts}
                disabled={loadingMore}
                size="lg"
                variant="outline"
                className="min-w-[200px]"
              >
                {loadingMore ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Products
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
              {[...Array(8)].map((_, i) => (
                <div key={`loading-more-${i}`} className="bg-white rounded-lg animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="md:hidden fixed right-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                {/* Mobile filter content (same as desktop) */}
                {/* Color Filter */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Color</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {FILTER_OPTIONS.colors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => toggleColorFilter(color.value)}
                        className={cn(
                          "w-12 h-12 rounded-full border-2 transition-all",
                          activeFilters.colors?.includes(color.value)
                            ? "border-black scale-110"
                            : "border-gray-300 hover:border-gray-400"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Price</h4>
                  <div className="space-y-2">
                    {FILTER_OPTIONS.priceRanges.map(range => (
                      <label key={range.value} className="flex items-center">
                        <input
                          type="radio"
                          name="price-mobile"
                          checked={activeFilters.priceRange === range.value}
                          onChange={() => setActiveFilters(prev => ({
                            ...prev,
                            priceRange: range.value
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Apply Button */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    onClick={clearAllFilters}
                    variant="outline" 
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                  <Button 
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Loading component for Suspense
function CollectionsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
        <h2 className="text-xl font-semibold">Loading Collections...</h2>
      </div>
    </div>
  )
}

// Main export with Suspense boundary
export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsLoading />}>
      <CollectionsContent />
    </Suspense>
  )
}