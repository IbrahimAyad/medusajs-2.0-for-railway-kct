'use client'

import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { useCoreCart } from '@/contexts/CoreCartContext'
import { AlertTriangle, ShoppingCart, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function MixedCartWarning() {
  const medusaCart = useMedusaCart()
  const coreCart = useCoreCart()
  
  const hasMedusaItems = medusaCart.cart?.items && medusaCart.cart.items.length > 0
  const hasCoreItems = coreCart.items && coreCart.items.length > 0
  
  // Only show warning if user has items in both carts
  if (!hasMedusaItems || !hasCoreItems) {
    return null
  }
  
  const medusaTotal = medusaCart.getSubtotal()
  const coreTotal = coreCart.getTotalPrice()
  
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40">
      <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-1">
              Multiple Cart Types Detected
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              You have items from different collections that require separate checkouts:
            </p>
            
            <div className="space-y-2 mb-4">
              {/* Core Cart Summary */}
              <div className="bg-white rounded p-2 border border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-burgundy-600" />
                    <span className="text-sm font-medium">Premium Collection</span>
                  </div>
                  <span className="text-sm font-bold">${coreTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {coreCart.getTotalItems()} items • Direct checkout
                </p>
              </div>
              
              {/* Medusa Cart Summary */}
              <div className="bg-white rounded p-2 border border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Extended Catalog</span>
                  </div>
                  <span className="text-sm font-bold">${medusaTotal.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {medusaCart.getItemCount()} items • Inventory checkout
                </p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Link href="/checkout/core" className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  Checkout Premium
                </Button>
              </Link>
              <Link href="/checkout/medusa" className="flex-1">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  Checkout Catalog
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-amber-700 mt-2 text-center">
              Complete one checkout, then return for the other
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}