'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'

interface ManualPaymentFormProps {
  cartId: string
  amount: number
  onSuccess?: (order: any) => void
}

export function ManualPaymentForm({ cartId, amount, onSuccess }: ManualPaymentFormProps) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setError(null)

    try {
      // For testing, use Stripe test card: 4242 4242 4242 4242
      if (cardDetails.number.replace(/\s/g, '') === '4242424242424242') {
        // Simulate successful payment
        console.log('Test payment successful for cart:', cartId)
        
        // Try to complete the cart
        try {
          const response = await fetch('https://backend-production-7441.up.railway.app/store/carts/' + cartId + '/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
            }
          })

          if (response.ok) {
            const data = await response.json()
            localStorage.removeItem('medusa_cart_id')
            if (onSuccess) {
              onSuccess(data.order || data)
            } else {
              window.location.href = '/checkout/success'
            }
          } else {
            throw new Error('Failed to complete order')
          }
        } catch (err) {
          console.error('Cart completion error:', err)
          throw new Error('Order completion failed. Please contact support.')
        }
      } else {
        throw new Error('Please use test card 4242 4242 4242 4242')
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + (v.length > 2 ? '/' + v.substring(2, 4) : '')
    }
    return v
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        <p className="text-sm font-medium">Test Mode</p>
        <p className="text-xs mt-1">Use card number: 4242 4242 4242 4242</p>
        <p className="text-xs">Any future expiry, any 3-digit CVC</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cardholder Name</label>
          <input
            type="text"
            value={cardDetails.name}
            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Card Number</label>
          <input
            type="text"
            value={cardDetails.number}
            onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Expiry</label>
            <input
              type="text"
              value={cardDetails.expiry}
              onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CVC</label>
            <input
              type="text"
              value={cardDetails.cvc}
              onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, '') })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="123"
              maxLength={3}
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="pt-2">
          <div className="text-center text-sm text-gray-600 mb-3">
            Total amount: ${(amount / 100).toFixed(2)}
          </div>
          
          <Button
            type="submit"
            disabled={processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}