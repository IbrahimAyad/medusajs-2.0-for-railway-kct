# Unified Shop Filter Implementation Examples

This document provides practical examples of how to implement and use the unified shop filter architecture.

## 1. API Integration Example

### Updated Products API Route
```typescript
// src/app/api/products/unified/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { unifiedSearchEngine } from '@/lib/services/unifiedSearchEngine'
import { parseURLFilters, parseURLSort } from '@/lib/utils/url-filters'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse URL parameters into filter objects
    const filters = parseURLFilters(searchParams)
    const sort = parseURLSort(searchParams)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const query = searchParams.get('q') || searchParams.get('search') || ''

    // Use unified search engine
    const result = await unifiedSearchEngine.searchProducts(
      query,
      filters,
      sort,
      page,
      limit
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unified search error:', error)
    return NextResponse.json(
      { error: 'Search failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

## 2. Frontend Component Integration

### Enhanced Products Page
```tsx
// src/app/products/UnifiedProductsPage.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedProduct, UnifiedProductFilters, UnifiedSearchResult } from '@/types/unified-shop'
import { parseURLFilters, buildShopURL, updateBrowserURL } from '@/lib/utils/url-filters'
import { FILTER_PRESETS, getSeasonalPresets } from '@/lib/config/filter-presets'
import { UnifiedProductGrid } from '@/components/shop/UnifiedProductGrid'
import { UnifiedFiltersPanel } from '@/components/shop/UnifiedFiltersPanel'
import { FilterPresetBar } from '@/components/shop/FilterPresetBar'

export default function UnifiedProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchResult, setSearchResult] = useState<UnifiedSearchResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UnifiedProductFilters>({})

  // Parse URL filters on load
  useEffect(() => {
    const urlFilters = parseURLFilters(searchParams)
    setFilters(urlFilters)
  }, [searchParams])

  // Load products when filters change
  useEffect(() => {
    loadProducts()
  }, [filters])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Add all filter parameters
      if (filters.preset) params.set('preset', filters.preset)
      if (filters.search) params.set('q', filters.search)
      if (filters.colors) params.set('colors', filters.colors.join(','))
      if (filters.occasions) params.set('occasions', filters.occasions.join(','))
      // ... add other filters

      const response = await fetch(`/api/products/unified?${params.toString()}`)
      const result = await response.json()
      
      if (response.ok) {
        setSearchResult(result)
      } else {
        throw new Error(result.error || 'Failed to load products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = useCallback((newFilters: UnifiedProductFilters) => {
    setFilters(newFilters)
    updateBrowserURL(newFilters)
  }, [])

  const handlePresetSelect = useCallback((presetId: string) => {
    const newFilters = { ...filters, preset: presetId }
    handleFiltersChange(newFilters)
  }, [filters, handleFiltersChange])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with search and quick filters */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-serif mb-4">Shop All Products</h1>
          
          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search suits, bundles, occasions..."
              value={filters.search || ''}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
              className="w-full max-w-md px-4 py-2 border-2 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Presets */}
          <FilterPresetBar
            presets={[
              ...getSeasonalPresets(), // Current season presets
              ...FILTER_PRESETS.filter(p => p.isPopular)
            ]}
            activePresetId={filters.preset}
            onPresetSelect={handlePresetSelect}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <UnifiedFiltersPanel
              filters={filters}
              facets={searchResult?.facets}
              onFiltersChange={handleFiltersChange}
              activeCount={Object.keys(filters).length}
            />
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <UnifiedProductGrid
              products={searchResult?.products || []}
              loading={loading}
              totalCount={searchResult?.totalCount || 0}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Unified Product Card Component
```tsx
// src/components/shop/UnifiedProductCard.tsx
import React from 'react'
import Link from 'next/link'
import { UnifiedProduct, UnifiedProductCardProps } from '@/types/unified-shop'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart, Eye } from 'lucide-react'

export function UnifiedProductCard({
  product,
  variant = 'default',
  size = 'medium',
  showBundleBreakdown = true,
  showSavings = true,
  showVariants = false,
  className,
  onProductClick,
  onQuickView,
  onAddToCart
}: UnifiedProductCardProps) {
  const isBundle = product.type === 'bundle'
  const priceInDollars = product.price / 100
  const compareAtPriceInDollars = product.compareAtPrice ? product.compareAtPrice / 100 : null
  const savingsInDollars = product.savings ? product.savings / 100 : null

  return (
    <div className={`group relative bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
        <img
          src={product.primaryImage || '/placeholder-product.jpg'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 space-y-1">
          {isBundle && (
            <Badge className="bg-blue-600 text-white">Complete Look</Badge>
          )}
          {product.trending && (
            <Badge className="bg-orange-500 text-white">Trending</Badge>
          )}
          {product.featured && (
            <Badge className="bg-gold-600 text-white">Featured</Badge>
          )}
          {savingsInDollars && showSavings && (
            <Badge className="bg-green-600 text-white">
              Save ${savingsInDollars.toFixed(0)}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault()
                onQuickView?.(product)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault()
                // Toggle favorite logic
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <Link 
          href={isBundle ? `/bundles/${product.handle}` : `/products/${product.handle}`}
          onClick={() => onProductClick?.(product)}
        >
          <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Bundle Component Breakdown */}
        {isBundle && showBundleBreakdown && product.bundleComponents && (
          <div className="mb-3">
            <div className="text-sm text-gray-600 space-y-1">
              {product.bundleComponents.map((component, index) => (
                <div key={index} className="flex justify-between">
                  <span className="capitalize">{component.type}:</span>
                  <span>{component.color}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Occasions */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {product.searchableOccasions.slice(0, 3).map((occasion, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {occasion}
              </Badge>
            ))}
            {product.searchableOccasions.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{product.searchableOccasions.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Variants (for individual products) */}
        {!isBundle && showVariants && product.variants && product.variants.length > 1 && (
          <div className="mb-3">
            <div className="text-sm text-gray-600">
              {product.variants.length} variants available
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                ${priceInDollars.toFixed(0)}
              </span>
              {compareAtPriceInDollars && compareAtPriceInDollars > priceInDollars && (
                <span className="text-sm text-gray-500 line-through">
                  ${compareAtPriceInDollars.toFixed(0)}
                </span>
              )}
            </div>
            {isBundle && (
              <div className="text-xs text-green-600 font-medium">
                Complete styled look
              </div>
            )}
          </div>

          {/* AI Score */}
          {product.aiScore && product.aiScore > 85 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-purple-600 font-medium">
                AI Score: {product.aiScore}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={(e) => {
              e.preventDefault()
              onAddToCart?.(product)
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          <Button
            variant="outline"
            onClick={() => onQuickView?.(product)}
          >
            Quick View
          </Button>
        </div>

        {/* Stock Status */}
        {!product.inStock && (
          <div className="mt-2 text-sm text-red-600">
            Out of Stock
          </div>
        )}
      </div>
    </div>
  )
}
```

## 3. URL Examples in Practice

### Preset-Based URLs
```
# Black tie events preset
/products?preset=black-tie

# Summer wedding preset with additional color filter
/products?preset=summer-wedding&colors=light-blue,sage-green

# Business professional with navy focus
/products?preset=business-professional&colors=navy
```

### Custom Filter Combinations
```
# Search for black suits including both individual products and bundles
/products?search=black+suit&colors=black&type=all

# Wedding guest attire under $250
/products?occasions=wedding&price=0-250&sort=price-asc

# Bold bundle styles in burgundy
/products?bundleCategory=bold&colors=burgundy&type=bundles

# Prom suits with specific price points
/products?occasions=prom&pricePoint=199,229&sort=trending-desc
```

### Complex Filter URLs
```
# Multi-criteria search
/products?occasions=wedding,cocktail&colors=navy,charcoal&season=summer&bundleCategory=sophisticated&featured=true

# Component-specific bundle filtering
/products?suitColor=black&shirtColor=white&tieColor=burgundy&type=bundles

# Price range with style filters
/products?price=199-299&styles=modern,sophisticated&trending=true
```

## 4. React Hooks for Filter Management

### useUnifiedFilters Hook
```typescript
// src/hooks/useUnifiedFilters.ts
import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UnifiedProductFilters, UnifiedSearchResult } from '@/types/unified-shop'
import { parseURLFilters, buildShopURL, updateBrowserURL } from '@/lib/utils/url-filters'

export function useUnifiedFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [filters, setFilters] = useState<UnifiedProductFilters>({})
  const [searchResult, setSearchResult] = useState<UnifiedSearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Parse URL filters on mount and when URL changes
  useEffect(() => {
    const urlFilters = parseURLFilters(searchParams)
    setFilters(urlFilters)
  }, [searchParams])

  // Load products when filters change
  useEffect(() => {
    loadProducts()
  }, [filters])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Convert filters to URL params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.set(key, value.join(','))
          } else {
            params.set(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/products/unified?${params.toString()}`)
      const result = await response.json()
      
      if (response.ok) {
        setSearchResult(result)
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateFilters = useCallback((newFilters: UnifiedProductFilters) => {
    setFilters(newFilters)
    updateBrowserURL(newFilters)
  }, [])

  const addFilter = useCallback((key: keyof UnifiedProductFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    updateFilters(newFilters)
  }, [filters, updateFilters])

  const removeFilter = useCallback((key: keyof UnifiedProductFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    updateFilters(newFilters)
  }, [filters, updateFilters])

  const clearFilters = useCallback(() => {
    updateFilters({})
  }, [updateFilters])

  const toggleFilter = useCallback((key: keyof UnifiedProductFilters, value: any) => {
    const currentValue = filters[key]
    
    if (Array.isArray(currentValue)) {
      const newArray = currentValue.includes(value)
        ? currentValue.filter(v => v !== value)
        : [...currentValue, value]
      
      addFilter(key, newArray.length > 0 ? newArray : undefined)
    } else {
      if (currentValue === value) {
        removeFilter(key)
      } else {
        addFilter(key, value)
      }
    }
  }, [filters, addFilter, removeFilter])

  return {
    filters,
    searchResult,
    loading,
    updateFilters,
    addFilter,
    removeFilter,
    clearFilters,
    toggleFilter,
    activeFilterCount: Object.keys(filters).length,
    hasResults: (searchResult?.totalCount || 0) > 0
  }
}
```

## 5. SEO Implementation

### Dynamic Metadata Generation
```typescript
// src/app/products/metadata.ts
import { Metadata } from 'next'
import { getPresetById } from '@/lib/config/filter-presets'
import { parseURLFilters } from '@/lib/utils/url-filters'

export function generateMetadata({ searchParams }: { searchParams: URLSearchParams }): Metadata {
  const filters = parseURLFilters(searchParams)
  
  // Handle preset-based metadata
  if (filters.preset) {
    const preset = getPresetById(filters.preset)
    if (preset) {
      return {
        title: preset.seoTitle || `${preset.name} | KCT Menswear`,
        description: preset.seoDescription || preset.description,
        openGraph: {
          title: preset.name,
          description: preset.shortDescription || preset.description,
          images: preset.heroImage ? [{ url: preset.heroImage }] : undefined
        }
      }
    }
  }

  // Generate dynamic metadata for custom filters
  let title = 'Shop'
  let description = 'Discover our collection of'

  if (filters.occasions && filters.occasions.length > 0) {
    title += ` ${filters.occasions.join(' & ')} Attire`
    description += ` ${filters.occasions.join(' and ')} attire`
  }

  if (filters.colors && filters.colors.length > 0) {
    title += ` in ${filters.colors.join(' & ')}`
    description += ` in ${filters.colors.join(' and ')}`
  }

  if (filters.bundleCategories && filters.bundleCategories.length > 0) {
    description += ` with ${filters.bundleCategories.join(' and ')} styling`
  }

  title += ' | KCT Menswear'
  description += '. Premium menswear and complete styled bundles.'

  return {
    title,
    description,
    openGraph: {
      title,
      description
    }
  }
}
```

## 6. Performance Optimizations

### Debounced Search Hook
```typescript
// src/hooks/useDebounceUnifiedSearch.ts
import { useState, useEffect, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { UnifiedProductFilters } from '@/types/unified-shop'

export function useDebouncedUnifiedSearch(
  filters: UnifiedProductFilters,
  delay: number = 300
) {
  const [immediateFilters, setImmediateFilters] = useState(filters)
  const debouncedFilters = useDebounce(immediateFilters, delay)

  // Update immediate filters for UI responsiveness
  useEffect(() => {
    setImmediateFilters(filters)
  }, [filters])

  // Memoize expensive filter operations
  const processedFilters = useMemo(() => {
    return {
      ...debouncedFilters,
      // Process complex filters here
      normalizedColors: debouncedFilters.colors?.map(c => c.toLowerCase()),
      normalizedOccasions: debouncedFilters.occasions?.map(o => o.toLowerCase())
    }
  }, [debouncedFilters])

  return {
    immediateFilters, // For immediate UI updates
    debouncedFilters: processedFilters, // For API calls
    isDebouncing: immediateFilters !== debouncedFilters
  }
}
```

This comprehensive implementation plan provides a solid foundation for the unified shop page filter architecture. The system is designed to be scalable, maintainable, and provides excellent user experience across all product types while maintaining SEO benefits and performance optimization.