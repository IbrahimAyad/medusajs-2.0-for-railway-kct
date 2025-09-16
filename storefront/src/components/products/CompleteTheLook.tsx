'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProductUrl } from '@/lib/products/navigation'
import EnhancedImage from '@/components/ui/enhanced-image'
import { fetchMedusaProducts } from '@/services/medusaBackendService'
import { getProductPriceAsNumber } from '@/utils/pricing'

interface SuggestedProduct {
  id: string
  handle?: string
  title: string
  price: number
  image: string
  category: string
}

interface CompleteTheLookProps {
  currentProduct: {
    id: string
    title: string
    category?: string
    price?: number
  }
  onAddToCart?: (products: SuggestedProduct[]) => void
}

// Generate smart suggestions based on product category
const generateSuggestions = async (product: any): Promise<SuggestedProduct[]> => {
  const title = product.title?.toLowerCase() || ''
  const suggestions: SuggestedProduct[] = []
  
  try {
    // Fetch actual products from backend
    const { products } = await fetchMedusaProducts({ limit: 20 })
    
    // Filter and categorize products for suggestions
    const shirts = products.filter(p => 
      p.title?.toLowerCase().includes('shirt') && p.id !== product.id
    )
    const ties = products.filter(p => 
      p.title?.toLowerCase().includes('tie') && !p.title?.toLowerCase().includes('bowtie') && p.id !== product.id
    )
    const accessories = products.filter(p => {
      const t = p.title?.toLowerCase() || ''
      return (t.includes('pocket') || t.includes('cufflink') || t.includes('belt') || t.includes('sock')) && p.id !== product.id
    })
    const shoes = products.filter(p => 
      (p.title?.toLowerCase().includes('shoe') || p.title?.toLowerCase().includes('oxford')) && p.id !== product.id
    )
    const vests = products.filter(p => 
      p.title?.toLowerCase().includes('vest') && p.id !== product.id
    )
    
    // If it's a suit, suggest shirt, tie, shoes, pocket square
    if (title.includes('suit') || title.includes('tuxedo') || title.includes('blazer')) {
      // Add a shirt
      if (shirts.length > 0) {
        const shirt = shirts[0]
        suggestions.push({
          id: shirt.id,
          handle: shirt.handle,
          title: shirt.title,
          price: getProductPriceAsNumber(shirt) || 89,
          image: shirt.thumbnail || shirt.images?.[0]?.url || 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/dd5c1f7d-722d-4e17-00be-60a3fdb33900/public',
          category: 'shirt'
        })
      }
      
      // Add a tie
      if (ties.length > 0) {
        const tie = ties[0]
        suggestions.push({
          id: tie.id,
          handle: tie.handle,
          title: tie.title,
          price: getProductPriceAsNumber(tie) || 45,
          image: tie.thumbnail || tie.images?.[0]?.url || 'https://cdn.kctmenswear.com/main-solid-vest-tie/light-gray-dusty-rose-tie.png',
          category: 'tie'
        })
      }
      
      // Add shoes
      if (shoes.length > 0) {
        const shoe = shoes[0]
        suggestions.push({
          id: shoe.id,
          handle: shoe.handle,
          title: shoe.title,
          price: getProductPriceAsNumber(shoe) || 195,
          image: shoe.thumbnail || shoe.images?.[0]?.url || 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/7d203d2a-63b7-46d3-9749-1f203e4ccc00/public',
          category: 'shoes'
        })
      }
      
      // Add an accessory
      if (accessories.length > 0) {
        const accessory = accessories[0]
        suggestions.push({
          id: accessory.id,
          handle: accessory.handle,
          title: accessory.title,
          price: getProductPriceAsNumber(accessory) || 25,
          image: accessory.thumbnail || accessory.images?.[0]?.url || 'https://cdn.kctmenswear.com/accessories/pocket-squares/white-pocket-square.png',
          category: 'accessory'
        })
      }
    }
    // If it's a shirt, suggest tie, vest, cufflinks
    else if (title.includes('shirt')) {
      // Add a tie
      if (ties.length > 0) {
        const tie = ties[0]
        suggestions.push({
          id: tie.id,
          handle: tie.handle,
          title: tie.title,
          price: getProductPriceAsNumber(tie) || 45,
          image: tie.thumbnail || tie.images?.[0]?.url || 'https://cdn.kctmenswear.com/main-solid-vest-tie/navy-tie.png',
          category: 'tie'
        })
      }
      
      // Add a vest
      if (vests.length > 0) {
        const vest = vests[0]
        suggestions.push({
          id: vest.id,
          handle: vest.handle,
          title: vest.title,
          price: getProductPriceAsNumber(vest) || 125,
          image: vest.thumbnail || vest.images?.[0]?.url || 'https://cdn.kctmenswear.com/main-solid-vest-tie/dusty-sage-model.png',
          category: 'vest'
        })
      }
      
      // Add accessories
      accessories.slice(0, 2).forEach(accessory => {
        suggestions.push({
          id: accessory.id,
          handle: accessory.handle,
          title: accessory.title,
          price: getProductPriceAsNumber(accessory) || 65,
          image: accessory.thumbnail || accessory.images?.[0]?.url || 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/c5b5c5d5-5b5c-4b5c-5b5c-5b5c5b5c5b5c/public',
          category: 'accessory'
        })
      })
    }
    // Default suggestions for other products
    else {
      // Add varied suggestions
      const allProducts = [...shirts, ...ties, ...accessories, ...vests].filter(p => p.id !== product.id)
      allProducts.slice(0, 4).forEach((item, index) => {
        suggestions.push({
          id: item.id,
          handle: item.handle,
          title: item.title,
          price: getProductPriceAsNumber(item) || [85, 22, 45, 125][index],
          image: item.thumbnail || item.images?.[0]?.url || [
            'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p/public',
            'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/s9o8c7k6s-5d4r-3e2s-1s0s-9o8c7k6s5d4r/public',
            'https://cdn.kctmenswear.com/main-solid-vest-tie/light-gray-dusty-rose-tie.png',
            'https://cdn.kctmenswear.com/main-solid-vest-tie/dusty-sage-model.png'
          ][index],
          category: ['accessory', 'accessory', 'tie', 'vest'][index]
        })
      })
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    // Return fallback suggestions if API fails
    return getFallbackSuggestions(title)
  }
  
  // Ensure we have at least 4 suggestions
  if (suggestions.length < 4) {
    const fallbacks = getFallbackSuggestions(title)
    return [...suggestions, ...fallbacks.slice(0, 4 - suggestions.length)]
  }
  
  return suggestions.slice(0, 4)
}

// Fallback suggestions if API fails
const getFallbackSuggestions = (title: string): SuggestedProduct[] => {
  const isSuit = title.includes('suit') || title.includes('tuxedo')
  
  if (isSuit) {
    return [
      {
        id: 'fallback-shirt-1',
        handle: 'white-dress-shirt',
        title: 'Classic White Dress Shirt',
        price: 89,
        image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/dd5c1f7d-722d-4e17-00be-60a3fdb33900/public',
        category: 'shirt'
      },
      {
        id: 'fallback-tie-1',
        handle: 'burgundy-silk-tie',
        title: 'Burgundy Silk Tie',
        price: 45,
        image: 'https://cdn.kctmenswear.com/main-solid-vest-tie/light-gray-dusty-rose-tie.png',
        category: 'tie'
      },
      {
        id: 'fallback-shoes-1',
        handle: 'oxford-dress-shoes',
        title: 'Black Oxford Dress Shoes',
        price: 195,
        image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/7d203d2a-63b7-46d3-9749-1f203e4ccc00/public',
        category: 'shoes'
      },
      {
        id: 'fallback-pocket-1',
        handle: 'white-pocket-square',
        title: 'White Linen Pocket Square',
        price: 25,
        image: 'https://cdn.kctmenswear.com/accessories/pocket-squares/white-pocket-square.png',
        category: 'accessory'
      }
    ]
  }
  
  return [
    {
      id: 'fallback-tie-2',
      handle: 'navy-pattern-tie',
      title: 'Navy Pattern Tie',
      price: 45,
      image: 'https://cdn.kctmenswear.com/main-solid-vest-tie/navy-tie.png',
      category: 'tie'
    },
    {
      id: 'fallback-vest-1',
      handle: 'matching-vest',
      title: 'Matching Vest',
      price: 125,
      image: 'https://cdn.kctmenswear.com/main-solid-vest-tie/dusty-sage-model.png',
      category: 'vest'
    },
    {
      id: 'fallback-belt-1',
      handle: 'leather-dress-belt',
      title: 'Italian Leather Belt',
      price: 85,
      image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/a1b2c3d4-5e6f-7g8h-9i0j-1k2l3m4n5o6p/public',
      category: 'accessory'
    },
    {
      id: 'fallback-socks-1',
      handle: 'dress-socks',
      title: 'Merino Wool Dress Socks',
      price: 22,
      image: 'https://imagedelivery.net/QI-O2U_ayTU_H_Ilcb4c6Q/s9o8c7k6s-5d4r-3e2s-1s0s-9o8c7k6s5d4r/public',
      category: 'accessory'
    }
  ]
}

export default function CompleteTheLook({ currentProduct, onAddToCart }: CompleteTheLookProps) {
  const [suggestions, setSuggestions] = useState<SuggestedProduct[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bundleDiscount] = useState(15) // 15% off when buying multiple items
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadSuggestions = async () => {
      setIsLoading(true)
      const newSuggestions = await generateSuggestions(currentProduct)
      setSuggestions(newSuggestions)
      setIsLoading(false)
    }
    
    loadSuggestions()
  }, [currentProduct])
  
  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }
  
  const calculateTotal = () => {
    const selectedProducts = suggestions.filter(s => selectedItems.has(s.id))
    // Ensure currentProduct.price is a number
    const currentPrice = typeof currentProduct.price === 'number' ? currentProduct.price : 0
    const subtotal = selectedProducts.reduce((acc, p) => acc + (typeof p.price === 'number' ? p.price : 0), 0) + currentPrice
    const discount = selectedItems.size > 0 ? subtotal * (bundleDiscount / 100) : 0
    return {
      subtotal,
      discount,
      total: subtotal - discount
    }
  }
  
  const { subtotal, discount, total } = calculateTotal()
  
  if (isLoading) {
    return (
      <div className="mt-12 border-t pt-12">
        <h2 className="text-2xl font-light mb-6">Complete the Look</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="mt-12 border-t pt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-light">Complete the Look</h2>
        {selectedItems.size > 0 && (
          <div className="text-sm">
            <span className="text-green-600 font-medium">Save {bundleDiscount}%</span>
            <span className="text-gray-600 ml-2">on bundle</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {suggestions.map((item) => (
          <div key={item.id} className="relative group">
            <Link href={getProductUrl(item)}>
              <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 mb-3">
                <EnhancedImage
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  fallbackSrc="https://via.placeholder.com/300x400/f3f4f6/9ca3af?text=Product"
                />
                {selectedItems.has(item.id) && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white rounded-full p-2">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                )}
              </div>
            </Link>
            
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                "absolute top-2 right-2 p-2 rounded-full transition-all",
                selectedItems.has(item.id) 
                  ? "bg-green-600 text-white" 
                  : "bg-white/90 hover:bg-white text-gray-700"
              )}
              aria-label={selectedItems.has(item.id) ? "Remove from bundle" : "Add to bundle"}
            >
              <Plus className={cn(
                "w-4 h-4 transition-transform",
                selectedItems.has(item.id) && "rotate-45"
              )} />
            </button>
            
            <div className="px-1">
              <h3 className="text-sm font-light line-clamp-1">{item.title}</h3>
              <p className="text-sm font-medium">${(typeof item.price === 'number' ? item.price : 0).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
      
      {selectedItems.size > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span>Current item</span>
              <span>${(typeof currentProduct.price === 'number' ? currentProduct.price.toFixed(2) : '0.00')}</span>
            </div>
            {suggestions.filter(s => selectedItems.has(s.id)).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">+ {item.title}</span>
                <span className="text-gray-600">${(typeof item.price === 'number' ? item.price : 0).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Bundle Discount ({bundleDiscount}%)</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium mt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => onAddToCart?.(suggestions.filter(s => selectedItems.has(s.id)))}
            className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Add Bundle to Cart
          </button>
        </div>
      )}
    </div>
  )
}