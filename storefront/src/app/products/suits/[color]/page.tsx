'use client'

import { useParams, notFound } from 'next/navigation'
import { useState, useEffect } from 'react'
import SimpleSuitProductDetail from '@/components/products/SimpleSuitProductDetail'
import { getAllCoreProducts } from '@/lib/config/coreProducts'
import { Package } from 'lucide-react'

export default function SuitDetailPage() {
  const params = useParams()
  const color = params.color as string
  const [suitData, setSuitData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !color) return
    
    // Load suit data
    const loadSuitData = () => {
      const coreProducts = getAllCoreProducts()
      const suits = coreProducts.filter(p => p.category === 'suits')
      
      // Find matching suits for this color
      const twoPiece = suits.find(s => s.id === `suit-${color}-2p`)
      const threePiece = suits.find(s => s.id === `suit-${color}-3p`)
      
      if (!twoPiece && !threePiece) {
        setLoading(false)
        return
      }
      
      // Format color name
      const colorNames: { [key: string]: string } = {
        'navy': 'Navy',
        'black': 'Black',
        'charcoal': 'Charcoal Grey',
        'lightgrey': 'Light Grey',
        'midnight': 'Midnight Blue',
        'burgundy': 'Burgundy',
        'emerald': 'Emerald',
        'hunter': 'Hunter Green',
        'indigo': 'Indigo',
        'tan': 'Tan',
        'sand': 'Sand',
        'beige': 'Beige',
        'brown': 'Brown',
        'darkbrown': 'Dark Brown'
      }
      
      const formattedName = colorNames[color] || color.charAt(0).toUpperCase() + color.slice(1)
      
      setSuitData({
        productId: `suit-${color}`,
        twoPiece: twoPiece?.stripePriceId || '',
        threePiece: threePiece?.stripePriceId || '',
        name: `${formattedName} Suit`,
        twoPiecePrice: 179.99,
        threePiecePrice: 199.99
      })
      
      setLoading(false)
    }
    
    loadSuitData()
  }, [color, mounted])

  // Don't render until client-side to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading suit details...</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading suit details...</p>
        </div>
      </div>
    )
  }

  if (!suitData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Suit Not Found</h1>
          <p className="text-gray-600 mb-4">The suit you're looking for doesn't exist.</p>
          <a href="/products/suits" className="text-blue-600 hover:underline">
            Browse all suits
          </a>
        </div>
      </div>
    )
  }

  return <SimpleSuitProductDetail color={color} suitData={suitData} />
}