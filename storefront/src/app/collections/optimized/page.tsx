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
import { MedusaProduct } from '@/services/medusaBackendService'
import { Button } from '@/components/ui/button'
import { 
  Package, Filter, X, ChevronDown, Search, 
  ShoppingBag, Check, Grid3x3, Grid2x2 
} from 'lucide-react'
import { cn } from '@/lib/utils'

function CollectionsContent() {
  const searchParams = useSearchParams()
  const collectionParam = searchParams.get('collection') || 'all-products'
  
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(3)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  
  // Active filters state
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    collection: collectionParam
  })
  
  // Load products by collection
  useEffect(() => {
    loadProducts()
  }, [collectionParam])
  
  // Apply filters when products or filters change
  useEffect(() => {
    const filtered = filterProducts(products, activeFilters)
    const sorted = sortProducts(filtered, sortBy)
    setFilteredProducts(sorted)
  }, [products, activeFilters, sortBy])
  
  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await fetchProductsByCollection(collectionParam)
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoading(false)
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
    setActiveFilters({ collection: collectionParam })
  }
  
  const activeFilterCount = 
    (activeFilters.colors?.length || 0) +
    (activeFilters.priceRange ? 1 : 0) +
    (activeFilters.occasion ? 1 : 0) +
    (activeFilters.style ? 1 : 0) +
    (activeFilters.inStock ? 1 : 0)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Collection Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">
            {FILTER_OPTIONS.collections.find(c => c.value === collectionParam)?.label || 'All Products'}
          </h1>
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${filteredProducts.length} products`}
          </p>
        </div>
        
        {/* Collection Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            <Link href="/collections/optimized?collection=all-products">
              <button className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                collectionParam === 'all-products' 
                  ? "bg-black text-white" 
                  : "bg-gray-100 hover:bg-gray-200"
              )}>
                All Products
              </button>
            </Link>
            {FILTER_OPTIONS.collections.map(collection => (
              <Link 
                key={collection.value} 
                href={`/collections/optimized?collection=${collection.value}`}
              >
                <button className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap transition-colors",
                  collectionParam === collection.value 
                    ? "bg-black text-white" 
                    : "bg-gray-100 hover:bg-gray-200"
                )}>
                  {collection.icon} {collection.label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-black text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
          
          <div className="flex items-center gap-4">
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
            
            {/* Grid Size */}
            <div className="hidden md:flex items-center gap-2 border rounded-lg p-1">
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
      
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters Sidebar */}
        {showFilters && (
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 sticky top-20">
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
                  {FILTER_OPTIONS.colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => toggleColorFilter(color.value)}
                      className={cn(
                        "w-10 h-10 rounded-full border-2 transition-all",
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
            </div>
          </aside>
        )}
        
        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
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
              {filteredProducts.map(product => {
                const stock = getProductStock(product)
                const collections = getProductCollections(product)
                const tags = getProductTags(product)
                const colorTag = tags.find(t => t.startsWith('color-'))
                const color = colorTag?.replace('color-', '')
                
                return (
                  <Link 
                    key={product.id} 
                    href={`/products/${product.handle}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative aspect-[3/4] bg-gray-100">
                        {product.thumbnail && (
                          <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}
                        
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
                        
                        {/* Quick Add Button */}
                        <button className="absolute bottom-4 left-4 right-4 bg-black text-white py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <ShoppingBag className="h-4 w-4" />
                          Quick Add
                        </button>
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
                          ${product.metadata?.tier_price || product.price || 0}
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
        </div>
      </div>
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
export default function OptimizedCollectionsPage() {
  return (
    <Suspense fallback={<CollectionsLoading />}>
      <CollectionsContent />
    </Suspense>
  )
}