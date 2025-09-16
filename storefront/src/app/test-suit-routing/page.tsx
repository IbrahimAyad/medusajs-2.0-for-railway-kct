'use client'

import Link from 'next/link'
import { getAllCoreProducts } from '@/lib/config/coreProducts'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export default function TestSuitRoutingPage() {
  const coreProducts = getAllCoreProducts()
  const suits = coreProducts.filter(p => p.category === 'suits')
  
  // Group suits by color
  const suitsByColor = new Map<string, any[]>()
  
  suits.forEach(suit => {
    const match = suit.id.match(/suit-([^-]+)-([23]p)/)
    if (match) {
      const color = match[1]
      if (!suitsByColor.has(color)) {
        suitsByColor.set(color, [])
      }
      suitsByColor.get(color)!.push(suit)
    }
  })
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Suit Routing Test</h1>
          <p className="text-gray-600 mb-8">
            Testing the core suit product routing structure
          </p>
          
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-semibold text-blue-900 mb-2">Routing Structure:</h2>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Main suits page: <code className="bg-white px-1 rounded">/products/suits</code></li>
              <li>• Individual suit: <code className="bg-white px-1 rounded">/products/suits/[color]</code></li>
              <li>• Example: <code className="bg-white px-1 rounded">/products/suits/navy</code></li>
            </ul>
          </div>
          
          <div className="mb-6">
            <Link 
              href="/products/suits"
              className="inline-flex items-center gap-2 px-6 py-3 bg-burgundy-600 text-white rounded hover:bg-burgundy-700 transition-colors"
            >
              View All Suits Page
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Individual Suit Links ({suitsByColor.size} colors)</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(suitsByColor.entries()).map(([color, colorSuits]) => {
              const displayName = colorNames[color] || color
              const has2p = colorSuits.some(s => s.id.endsWith('-2p'))
              const has3p = colorSuits.some(s => s.id.endsWith('-3p'))
              
              return (
                <div key={color} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{displayName}</h3>
                      <p className="text-sm text-gray-500">Color: {color}</p>
                    </div>
                    <div className="flex gap-1">
                      {has2p && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">2P</span>
                      )}
                      {has3p && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">3P</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600 mb-3">
                    {colorSuits.map(suit => (
                      <div key={suit.id} className="flex items-center gap-2">
                        {suit.stripePriceId ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-500" />
                        )}
                        <span className="font-mono">{suit.id}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link 
                    href={`/products/suits/${color}`}
                    className="block w-full text-center px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors text-sm"
                  >
                    View {displayName} Suit
                  </Link>
                </div>
              )
            })}
          </div>
          
          <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-3">Testing Instructions:</h3>
            <ol className="space-y-2 text-sm text-amber-800">
              <li>1. Click "View All Suits Page" to see the suits listing</li>
              <li>2. On the suits page, click any suit to go to its detail page</li>
              <li>3. The URL should be: <code className="bg-white px-1 rounded">/products/suits/[color]</code></li>
              <li>4. You should be able to select 2-piece or 3-piece options</li>
              <li>5. Adding to cart should work with the core cart system</li>
            </ol>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            Found {suits.length} suit products ({suitsByColor.size} unique colors)
          </div>
        </div>
      </div>
    </div>
  )
}