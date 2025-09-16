'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MedusaProduct } from '@/services/medusaBackendService'
import { filterProducts, parseMetadataField } from '@/services/medusaProductService'
import Link from 'next/link'

interface ProductSearchProps {
  products: MedusaProduct[]
  onClose?: () => void
  isOverlay?: boolean
}

export default function ProductSearch({ products, onClose, isOverlay = false }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<MedusaProduct[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Focus search on mount if overlay
  useEffect(() => {
    if (isOverlay && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOverlay])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!searchTerm.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    
    debounceRef.current = setTimeout(() => {
      performSearch(searchTerm)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchTerm, products])

  const performSearch = (term: string) => {
    const searchLower = term.toLowerCase()
    
    // Search across multiple fields
    const filtered = products.filter(product => {
      // Search in title
      if (product.title?.toLowerCase().includes(searchLower)) return true
      
      // Search in description
      if (product.description?.toLowerCase().includes(searchLower)) return true
      
      // Search in handle
      if (product.handle?.toLowerCase().includes(searchLower)) return true
      
      // Search in metadata collections
      const collections = parseMetadataField(product.metadata?.collections as string)
      if (collections.some(c => c.toLowerCase().includes(searchLower))) return true
      
      // Search in metadata tags
      const tags = parseMetadataField(product.metadata?.tags as string)
      if (tags.some(t => t.toLowerCase().includes(searchLower))) return true
      
      // Search in metadata categories
      const categories = parseMetadataField(product.metadata?.categories as string)
      if (categories.some(c => c.toLowerCase().includes(searchLower))) return true
      
      // Search in metadata colors
      const colors = parseMetadataField(product.metadata?.colors as string)
      if (colors.some(c => c.toLowerCase().includes(searchLower))) return true
      
      // Search in metadata occasions
      const occasions = parseMetadataField(product.metadata?.occasions as string)
      if (occasions.some(o => o.toLowerCase().includes(searchLower))) return true
      
      // Search in metadata styles
      const styles = parseMetadataField(product.metadata?.styles as string)
      if (styles.some(s => s.toLowerCase().includes(searchLower))) return true
      
      // Search in variant SKUs
      if (product.variants?.some(v => v.sku?.toLowerCase().includes(searchLower))) return true
      
      return false
    })
    
    // Sort by relevance (title matches first)
    filtered.sort((a, b) => {
      const aTitle = a.title?.toLowerCase().includes(searchLower) ? 1 : 0
      const bTitle = b.title?.toLowerCase().includes(searchLower) ? 1 : 0
      return bTitle - aTitle
    })
    
    setResults(filtered.slice(0, 20)) // Limit to 20 results
    setIsSearching(false)
  }

  const getPrice = (product: MedusaProduct) => {
    const priceInCents = product.price || 0
    const priceInDollars = priceInCents / 100
    return priceInDollars.toFixed(2)
  }

  const getCollections = (product: MedusaProduct) => {
    return parseMetadataField(product.metadata?.collections as string)
  }

  const getColors = (product: MedusaProduct) => {
    return parseMetadataField(product.metadata?.colors as string)
  }

  if (!isOverlay) {
    // Inline search bar
    return (
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Inline Results Dropdown */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.handle || product.id}`}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  {product.thumbnail && (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{product.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">${getPrice(product)}</span>
                      {getColors(product).length > 0 && (
                        <span className="text-xs text-gray-400">
                          {getColors(product).slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Full overlay search
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white z-50 overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Search Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search products, collections, colors..."
                className="w-full pl-10 pr-4 py-3 text-lg focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4">
            {isSearching ? (
              <div className="text-center py-8 text-gray-500">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-4">
                  {results.length} result{results.length !== 1 ? 's' : ''} for "{searchTerm}"
                </p>
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle || product.id}`}
                    onClick={onClose}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    {product.thumbnail && (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{product.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-medium">${getPrice(product)}</span>
                        {getCollections(product).length > 0 && (
                          <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                            {getCollections(product)[0]}
                          </span>
                        )}
                        {getColors(product).length > 0 && (
                          <span className="text-xs text-gray-500">
                            {getColors(product).length} color{getColors(product).length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchTerm.trim() ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No results found for "{searchTerm}"</p>
                <p className="text-sm text-gray-400 mt-2">Try searching for suits, shirts, or colors</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Start typing to search products</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}