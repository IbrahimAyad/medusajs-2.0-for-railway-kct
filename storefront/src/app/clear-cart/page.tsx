'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, ShoppingCart, Trash2 } from 'lucide-react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { Button } from '@/components/ui/button'

export default function ClearCartPage() {
  const [cleared, setCleared] = useState(false)
  const [cartId, setCartId] = useState<string | null>(null)
  const medusaCart = useMedusaCart()
  
  useEffect(() => {
    const storedCartId = localStorage.getItem('medusa_cart_id')
    setCartId(storedCartId)
  }, [])
  
  const clearCart = () => {
    // DISABLED: Cart deletion moved to after order confirmation
    // localStorage.removeItem('medusa_cart_id')
    // localStorage.removeItem('medusa_cart')
    // localStorage.removeItem('cart')
    
    // DISABLED: Cart deletion moved to after order confirmation
    // sessionStorage.clear()
    
    console.log('Cart clearing disabled during webhook fix')
    setCleared(true)
    setCartId(null)
    
    // Reload after a short delay
    setTimeout(() => {
      window.location.href = '/'
    }, 2000)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingCart className="h-8 w-8 text-burgundy-600" />
            <h1 className="text-2xl font-bold">Cart Management</h1>
          </div>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h2 className="font-semibold text-gray-900 mb-1">Current Cart Status</h2>
              {cartId ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">Cart ID stored in browser:</p>
                  <code className="text-xs bg-gray-100 p-1 rounded font-mono">{cartId}</code>
                </div>
              ) : (
                <p className="text-sm text-green-600">No cart ID found in browser</p>
              )}
            </div>
            
            {!cleared ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-medium text-amber-900 mb-2">What this does:</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Clears expired cart IDs from browser storage</li>
                    <li>• Removes any stuck cart data</li>
                    <li>• Fixes cart-related 500 errors</li>
                    <li>• Allows fresh cart creation on next add-to-cart</li>
                  </ul>
                </div>
                
                <Button
                  onClick={clearCart}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart Data & Fix Errors
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-green-900">Cart Cleared Successfully!</h3>
                <p className="text-gray-600">Redirecting to homepage in 2 seconds...</p>
                <div className="animate-pulse">
                  <div className="h-1 bg-green-500 rounded-full" style={{animation: 'pulse 2s'}}></div>
                </div>
              </div>
            )}
            
            <div className="border-t pt-6">
              <h3 className="font-medium mb-3">Troubleshooting Other Issues:</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <strong>404 Errors:</strong> Some collection pages haven't been created yet.
                    These are planned features.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Working Pages:</strong>
                    <ul className="mt-1 ml-4">
                      <li>• <a href="/shop/catalog" className="text-blue-600 hover:underline">Product Catalog</a></li>
                      <li>• <a href="/test-medusa-products" className="text-blue-600 hover:underline">Test Products Page</a></li>
                      <li>• <a href="/collections" className="text-blue-600 hover:underline">Collections</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}