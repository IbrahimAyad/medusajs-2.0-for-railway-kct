'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { STRIPE_PUBLISHABLE_KEY, isValidStripeKey } from '@/lib/stripe-config'
import { medusa, MEDUSA_CONFIG } from '@/lib/medusa/client'

// Validate the key first
if (!isValidStripeKey(STRIPE_PUBLISHABLE_KEY)) {
  console.error('❌ Invalid Stripe publishable key. Payment will not work.')
  console.error('Please update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Railway environment variables')
}

console.log('Loading Stripe with key:', STRIPE_PUBLISHABLE_KEY.substring(0, 20) + '...')

// Load Stripe with explicit configuration
const stripePromise = isValidStripeKey(STRIPE_PUBLISHABLE_KEY) 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY, {
      // Ensure we're not loading any beta features
      betas: [],
      // Set locale explicitly
      locale: 'en'
    }).then(stripe => {
      console.log('Stripe loaded:', !!stripe)
      if (!stripe) {
        console.error('Failed to load Stripe - key may be invalid for this account')
      }
      return stripe
    }).catch(error => {
      console.error('Error loading Stripe:', error)
      return null
    })
  : Promise.resolve(null)

interface StripeCheckoutProps {
  amount: number
  cartId: string
  email?: string
  onSuccess: () => void
}

function PaymentForm({ amount, cartId, onSuccess }: StripeCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?cart_id=${cartId}`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // If we get here without redirect, payment succeeded
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Complete the order via Medusa
        try {
          const order = await medusa.store.cart.complete(cartId)
          console.log('Order completed via Medusa:', order)
        } catch (orderError) {
          console.error('Order completion error:', orderError)
        }
        
        // Redirect to success page with payment details
        window.location.href = `/checkout/success?payment_intent=${paymentIntent.id}&cart_id=${cartId}`
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="min-h-[250px]">
        <PaymentElement 
          options={{
            layout: 'tabs',
          }}
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
          disabled={!stripe || !elements || processing}
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
              Pay ${(amount / 100).toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export function StripeCheckout({ amount, cartId, email, onSuccess }: StripeCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    console.log('Creating payment session for:', { amount, cartId, email })
    
    // Create payment session with order-first approach (primary), then fallback to bypass
    const initializePayment = async () => {
      try {
        // First try the order-first checkout endpoint (primary method)
        console.log('Attempting order-first checkout (primary method)...')
        await tryOrderFirstPayment()
      } catch (orderFirstError: any) {
        console.warn('Order-first checkout failed, trying bypass fallback:', orderFirstError.message)
        
        try {
          await tryDirectStripePayment()
        } catch (directError: any) {
          console.error('Both payment methods failed:', directError.message)
          setError(`Payment initialization failed: ${directError.message}`)
          setLoading(false)
        }
      }
    }

    const tryOrderFirstPayment = async () => {
      console.log('🎯 Creating order-first payment...')
      
      // Get cart details first
      const { cart } = await medusa.store.cart.retrieve(cartId)
      if (!cart) {
        throw new Error('Cart not found')
      }

      // Call our order-first checkout endpoint
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/store/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cartId,
          customer_email: email || cart.email,
          shipping_address: cart.shipping_address,
          billing_address: cart.billing_address
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Order-first payment failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Order-first payment failed - no client secret')
      }

      console.log('✅ Order-first payment initialized successfully')
      console.log('Client secret received:', data.client_secret.substring(0, 20) + '...')
      
      setClientSecret(data.client_secret)
      setDebugInfo({
        method: 'order_first',
        payment_intent_id: data.payment_intent_id,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        hasClientSecret: !!data.client_secret
      })
      setLoading(false)
    }

    const tryDirectStripePayment = async () => {
      console.log('🚀 Attempting bypass Stripe payment (fallback)...')
      
      // Get cart details first
      const { cart } = await medusa.store.cart.retrieve(cartId)
      if (!cart) {
        throw new Error('Cart not found')
      }

      // Call our bypass Stripe endpoint (fallback method)
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/stripe-bypass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cartId,
          customer_email: email || cart.email,
          shipping_address: cart.shipping_address,
          billing_address: cart.billing_address
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Bypass payment failed: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Bypass payment failed - no client secret')
      }

      console.log('✅ Bypass Stripe payment initialized successfully')
      console.log('Client secret received:', data.client_secret.substring(0, 20) + '...')
      
      setClientSecret(data.client_secret)
      setDebugInfo({
        method: 'bypass_stripe',
        payment_intent_id: data.payment_intent_id,
        amount: data.amount,
        currency: data.currency,
        hasClientSecret: !!data.client_secret
      })
      setLoading(false)
    }
    
    initializePayment()
  }, [amount, cartId, email])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-100"></div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Initializing payment...</p>
          <p className="text-sm text-gray-500 mt-1">Setting up secure payment processing</p>
        </div>
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Payment initialization failed</h3>
            <p className="text-sm mt-1 text-red-700">{error}</p>
            <p className="text-xs mt-2 text-red-600">
              Both order-first checkout and bypass Stripe fallback failed.
            </p>
            
            {debugInfo && (
              <details className="mt-3">
                <summary className="text-xs cursor-pointer text-red-600 hover:text-red-800">
                  Show technical details
                </summary>
                <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </details>
            )}
            
            <div className="flex space-x-3 mt-4">
              <Button 
                onClick={() => window.location.reload()} 
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.href = '/cart'} 
                size="sm"
                variant="ghost"
                className="text-red-600 hover:text-red-800"
              >
                Return to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        <p>Unable to initialize payment. Please try again.</p>
        <p className="text-xs mt-2">If this persists, check browser console for errors.</p>
      </div>
    )
  }

  console.log('Rendering Elements with client secret:', clientSecret.substring(0, 20) + '...')
  
  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#000000',
          },
        },
        loader: 'auto',
      }}
    >
      <PaymentForm 
        amount={amount} 
        cartId={cartId} 
        onSuccess={onSuccess} 
      />
    </Elements>
  )
}