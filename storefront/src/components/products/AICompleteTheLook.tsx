'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Check, Sparkles, Brain, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProductUrl } from '@/lib/products/navigation'
import EnhancedImage from '@/components/ui/enhanced-image'
import LazyProductSection from '@/components/products/LazyProductSection'
import { aiCompleteTheLookService, type AISuggestion } from '@/lib/services/aiCompleteTheLook'
import type { MedusaProduct } from '@/services/medusaBackendService'
import { getProductPrice, formatPrice } from '@/utils/pricing'

interface AICompleteTheLookProps {
  currentProduct: MedusaProduct
  onAddToCart?: (products: AISuggestion[]) => void
}

export default function AICompleteTheLook({ currentProduct, onAddToCart }: AICompleteTheLookProps) {
  // State management
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [bundleDiscount] = useState(15) // 15% off when buying multiple items
  const [isLoading, setIsLoading] = useState(true)
  const [aiEnhanced, setAiEnhanced] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState<'static' | 'cached' | 'ai'>('static')
  
  // Progressive loading effect
  useEffect(() => {
    let mounted = true
    
    const loadSuggestions = async () => {
      // Phase 1: Load static suggestions instantly (0-100ms)
      setLoadingPhase('static')
      setIsLoading(true)
      
      try {
        // Get static suggestions immediately
        const staticSuggestions = await aiCompleteTheLookService.getSuggestions(
          currentProduct,
          { useAI: false, limit: 4 }
        )
        
        if (mounted) {
          setSuggestions(staticSuggestions)
          setIsLoading(false)
        }
        
        // Phase 2: Try to get cached AI suggestions (100-500ms)
        setLoadingPhase('cached')
        const cachedSuggestions = await aiCompleteTheLookService.getSuggestions(
          currentProduct,
          { useCache: true, useAI: true, limit: 4 }
        )
        
        if (mounted && cachedSuggestions.some(s => s.isAiEnhanced)) {
          setSuggestions(cachedSuggestions)
          setAiEnhanced(true)
        }
        
      } catch (error) {
        console.error('Error loading suggestions:', error)
        // Keep showing static suggestions on error
      }
    }
    
    loadSuggestions()
    
    return () => {
      mounted = false
    }
  }, [currentProduct])
  
  // Enhance with full AI on user interaction
  const enhanceWithAI = useCallback(async () => {
    if (aiEnhanced) return // Already enhanced
    
    setLoadingPhase('ai')
    try {
      const aiSuggestions = await aiCompleteTheLookService.getSuggestions(
        currentProduct,
        { useCache: false, useAI: true, limit: 4 }
      )
      
      setSuggestions(aiSuggestions)
      setAiEnhanced(true)
    } catch (error) {
      console.error('AI enhancement failed:', error)
    }
  }, [currentProduct, aiEnhanced])
  
  // Selection management
  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
        // Trigger AI enhancement on user interaction
        if (!aiEnhanced) {
          enhanceWithAI()
        }
      }
      return newSet
    })
  }
  
  // Price calculations
  const calculateTotal = () => {
    const selectedProducts = suggestions.filter(s => selectedItems.has(s.id))
    const currentPrice = getProductPrice(currentProduct)
    const subtotal = selectedProducts.reduce((acc, p) => acc + p.price, 0) + currentPrice
    const discount = selectedItems.size > 0 ? subtotal * (bundleDiscount / 100) : 0
    return {
      subtotal,
      discount,
      total: subtotal - discount
    }
  }
  
  const { subtotal, discount, total } = calculateTotal()
  
  // Loading skeleton
  if (isLoading && suggestions.length === 0) {
    return (
      <LazyProductSection>
        <div className="mt-12 border-t pt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-light">Complete the Look</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Zap className="w-4 h-4 animate-pulse" />
              <span>Loading suggestions...</span>
            </div>
          </div>
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
      </LazyProductSection>
    )
  }
  
  return (
    <LazyProductSection>
      <div className="mt-12 border-t pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-light">Complete the Look</h2>
            {aiEnhanced && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">AI Enhanced</span>
              </div>
            )}
          </div>
          
          {selectedItems.size > 0 && (
            <div className="text-sm">
              <span className="text-green-600 font-medium">Save {bundleDiscount}%</span>
              <span className="text-gray-600 ml-2">on bundle</span>
            </div>
          )}
        </div>
        
        {/* Suggestion Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {suggestions.map((item, index) => (
            <div 
              key={item.id} 
              className="relative group"
              style={{
                animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`
              }}
            >
              <Link href={getProductUrl(item)}>
                <div className="aspect-[3/4] relative overflow-hidden bg-gray-50 mb-3 rounded-lg">
                  <EnhancedImage
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    fallbackSrc="https://via.placeholder.com/300x400/f3f4f6/9ca3af?text=Product"
                  />
                  
                  {/* AI Confidence Badge */}
                  {item.isAiEnhanced && item.confidence > 0.8 && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-600" />
                        <span className="text-xs font-medium">{Math.round(item.confidence * 100)}% match</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Selection Overlay */}
                  {selectedItems.has(item.id) && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
              
              {/* Add/Remove Button */}
              <button
                onClick={() => toggleItem(item.id)}
                onMouseEnter={enhanceWithAI}
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
              
              {/* Product Info */}
              <div className="px-1">
                <h3 className="text-sm font-light line-clamp-1">{item.title}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">${(typeof item.price === 'number' ? item.price : 0).toFixed(2)}</p>
                  {item.visualMatch && item.visualMatch > 0.7 && (
                    <span className="text-xs text-purple-600">Visual match</span>
                  )}
                </div>
                {item.reason && (
                  <p className="text-xs text-gray-500 mt-1">{item.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Bundle Summary */}
        {selectedItems.size > 0 && (
          <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Current item</span>
                <span>{formatPrice(getProductPrice(currentProduct))}</span>
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
              className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Add Smart Bundle to Cart
            </button>
            
            {aiEnhanced && (
              <p className="text-xs text-center text-gray-500 mt-2">
                AI curated for perfect style harmony
              </p>
            )}
          </div>
        )}
        
        {/* AI Enhancement Prompt */}
        {!aiEnhanced && suggestions.length > 0 && (
          <div className="mt-4 text-center">
            <button
              onClick={enhanceWithAI}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>Enhance with AI for better matches</span>
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </LazyProductSection>
  )
}