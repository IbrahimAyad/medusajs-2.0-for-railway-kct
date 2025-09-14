'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { STRIPE_PUBLISHABLE_KEY, isValidStripeKey } from '@/lib/stripe-config'
import { medusa, MEDUSA_CONFIG } from '@/lib/medusa/client'

interface SimpleStripeFormProps {
  amount: number
  cartId: string
  email?: string
  onSuccess: () => void
}

export function SimpleStripeForm({ amount, cartId, email, onSuccess }: SimpleStripeFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [postalCode, setPostalCode] = useState('')

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Create payment session directly with Medusa backend
      console.log('Creating payment session via Medusa for cart:', cartId)
      
      // First, retrieve the full cart object
      const { cart } = await medusa.store.cart.retrieve(cartId)
      
      if (!cart) {
        throw new Error('Cart not found')
      }
      
      // Get available payment providers to ensure Stripe is enabled
      const providers = await medusa.store.payment.listPaymentProviders({
        region_id: MEDUSA_CONFIG.regionId
      })
      const stripeProvider = providers.payment_providers?.find((p: any) => 
        (p.id === 'stripe' || p.id === 'pp_stripe_stripe') && p.is_enabled
      )
      
      if (!stripeProvider) {
        throw new Error('Stripe payment provider is not available')
      }
      
      // Initialize payment session with Stripe - passing cart object
      const paymentCollection = await medusa.store.payment.initiatePaymentSession(
        cart,  // Pass cart object, not cart ID
        { 
          provider_id: 'stripe'
        }
      )
      
      // Extract client secret from the Stripe session
      const stripeSession = paymentCollection.payment_sessions?.find(
        (session: any) => session.provider_id === 'stripe' || session.provider_id === 'pp_stripe_stripe'
      )
      
      if (!stripeSession?.data?.client_secret) {
        throw new Error('Failed to create Stripe payment session - no client secret received')
      }
      
      const clientSecret = stripeSession.data.client_secret
      console.log('Payment session created via Medusa')
      console.log('Client secret:', clientSecret.substring(0, 20) + '...')

      // Validate key before loading Stripe
      if (!isValidStripeKey(STRIPE_PUBLISHABLE_KEY)) {
        throw new Error('Invalid Stripe publishable key. Please contact support.')
      }
      
      // Load Stripe
      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY)
      
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      // Parse expiry
      const [expMonth, expYear] = expiry.split('/')
      
      // Confirm card payment
      console.log('Confirming card payment...')
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            number: cardNumber.replace(/\s/g, ''),
            exp_month: parseInt(expMonth),
            exp_year: parseInt('20' + expYear),
            cvc: cvc,
          },
          billing_details: {
            name: name || 'Customer',
            email: email || 'customer@example.com',
            address: {
              postal_code: postalCode || '10001',
            },
          },
        },
      })

      if (result.error) {
        console.error('Payment confirmation error:', result.error)
        throw new Error(result.error.message || 'Payment failed')
      }

      if (result.paymentIntent?.status === 'succeeded') {
        console.log('Payment succeeded!', result.paymentIntent)
        setSuccess(true)
        
        // Complete the order via Medusa
        try {
          const order = await medusa.store.cart.complete(cartId)
          console.log('Order completed via Medusa:', order)
        } catch (orderError) {
          console.error('Order completion error:', orderError)
          // Payment succeeded but order creation failed - still redirect
        }
        
        // Redirect to success page with payment details
        setTimeout(() => {
          window.location.href = `/checkout/success?payment_intent=${result.paymentIntent.id}&cart_id=${cartId}`
        }, 1500)
      } else {
        throw new Error('Payment was not successful')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-6 bg-green-50 text-green-700 rounded-lg text-center">
        <CheckCircle className="h-12 w-12 mx-auto mb-3" />
        <p className="font-medium text-lg">Payment Successful!</p>
        <p className="text-sm mt-1">Redirecting to confirmation...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
        <p className="text-sm font-medium">Simple Card Payment</p>
        <p className="text-xs mt-1">Direct card processing without Payment Element</p>
      </div>

      <div>
        <Label htmlFor="card-number">Card Number</Label>
        <Input
          id="card-number"
          type="text"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiry">Expiry Date</Label>
          <Input
            id="expiry"
            type="text"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            required
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            type="text"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
            maxLength={4}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="name">Cardholder Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="postal">ZIP / Postal Code</Label>
        <Input
          id="postal"
          type="text"
          placeholder="10001"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="pt-2">
        <div className="text-center text-sm text-gray-600 mb-3">
          Total: ${(amount / 100).toFixed(2)}
        </div>
        
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Test card: 4242 4242 4242 4242, 12/34, 123, 12345
      </div>
    </form>
  )
}