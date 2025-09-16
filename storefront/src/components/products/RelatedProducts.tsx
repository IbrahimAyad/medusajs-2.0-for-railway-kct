'use client'

import { MedusaProduct } from '@/services/medusaBackendService'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface RelatedProductsProps {
  products: MedusaProduct[]
  title?: string
  viewMode?: 'carousel' | 'grid'
}

export default function RelatedProducts({ 
  products, 
  title = "You May Also Like",
  viewMode = 'carousel'
}: RelatedProductsProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(checkScroll, 300)
    }
  }

  const getPrice = (product: MedusaProduct) => {
    const priceInCents = product.price || 0
    const priceInDollars = priceInCents / 100
    return priceInDollars.toFixed(2)
  }

  const getColors = (product: MedusaProduct) => {
    const colors = product.metadata?.colors as string
    if (!colors) return []
    return colors.split(',').map(c => c.trim()).filter(Boolean)
  }

  if (!products || products.length === 0) return null

  if (viewMode === 'grid') {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-light mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.handle || product.id}`}
              className="group"
            >
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium line-clamp-2 mb-1">
                {product.title}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">${getPrice(product)}</span>
                {getColors(product).length > 0 && (
                  <span className="text-xs text-gray-500">
                    {getColors(product).length} colors
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Carousel view
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-colors ${
              canScrollLeft 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-colors ${
              canScrollRight 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.handle || product.id}`}
            className="group flex-shrink-0 w-64"
          >
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-3">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium line-clamp-2 mb-1">
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">${getPrice(product)}</span>
              {getColors(product).length > 0 && (
                <span className="text-xs text-gray-500">
                  {getColors(product).length} colors
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}