'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ShoppingCart, Check, Loader2, ChevronDown } from 'lucide-react'
import { 
  fetchMedusaProductsPaginated, 
  getDefaultVariant,
  type MedusaProduct 
} from '@/services/medusaBackendService'
import { getProductPrice } from '@/utils/pricing'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 20

export default function OptimizedCatalogPage() {
  const [products, setProducts] = useState<MedusaProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  
  const { addItem, isLoading: cartLoading } = useMedusaCart()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      loadInitialProducts()
    }
  }, [mounted])

  const loadInitialProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchMedusaProductsPaginated(1, ITEMS_PER_PAGE)
      console.log('Initial products loaded:', result.products.length)
      
      if (result.products.length === 0) {
        setError('No products available. The catalog is being updated.')
      } else {
        setProducts(result.products)
        setHasMore(result.hasMore)
      }
    } catch (err: any) {
      setError('Unable to load products. Please try again later.')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreProducts = async () => {
    if (loadingMore || !hasMore) return
    
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await fetchMedusaProductsPaginated(nextPage, ITEMS_PER_PAGE)
      
      if (result.products.length > 0) {
        setProducts(prev => [...prev, ...result.products])
        setPage(nextPage)
        setHasMore(result.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more products:', err)
      toast.error('Failed to load more products')
    } finally {
      setLoadingMore(false)
    }
  }

  const handleAddToCart = async (e: React.MouseEvent, product: MedusaProduct) => {
    e.preventDefault()
    e.stopPropagation()
    
    const variant = getDefaultVariant(product)
    if (!variant) {
      toast.error('This product is not available')
      return
    }

    setAddingToCart(product.id)
    
    try {
      await addItem(variant.id, 1, product)
      setAddedItems(prev => new Set([...prev, product.id]))
      toast.success(`${product.title} added to cart!`)
      
      setTimeout(() => {
        setAddedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(product.id)
          return newSet
        })
      }, 3000)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add item to cart')
    } finally {
      setAddingToCart(null)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Catalog...</h2>
          <p className="text-gray-600">Fetching the latest products</p>
        </div>
      </div>
    )
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Catalog Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadInitialProducts}
            className="px-6 py-2 bg-burgundy-600 text-white rounded hover:bg-burgundy-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Extended Catalog</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Browse our complete inventory of {products.length}+ premium menswear items
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => {
            const variant = getDefaultVariant(product)
            const price = parseFloat(getProductPrice(variant))
            const isAdded = addedItems.has(product.id)
            const isAdding = addingToCart === product.id
            const isAvailable = variant && variant.inventory_quantity > 0
            
            return (
              <div key={product.id} className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <Link href={`/products/${product.handle}`}>
                  <div className="aspect-[3/4] relative bg-gray-100">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Quick add button overlay */}
                    {isAvailable && (
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={isAdding || cartLoading || isAdded}
                          className={`w-full py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                            isAdded 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="h-4 w-4" />
                              Added
                            </>
                          ) : isAdding ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              Quick Add
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {!isAvailable && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}
                    
                    {product.pricing_tier && (
                      <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded">
                        {product.pricing_tier}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold">
                        {price > 0 ? `$${price.toFixed(2)}` : 'Contact for Price'}
                      </p>
                      {variant && (
                        <p className="text-xs text-gray-500">
                          {variant.inventory_quantity > 0 
                            ? `${variant.inventory_quantity} in stock`
                            : 'Out of stock'}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="h-5 w-5" />
                  Load More Products
                </>
              )}
            </button>
          </div>
        )}

        {!hasMore && products.length > 0 && (
          <div className="mt-12 text-center text-gray-600">
            <p>You've reached the end of the catalog</p>
            <p className="text-sm mt-1">{products.length} products displayed</p>
          </div>
        )}
      </div>
    </div>
  )
}