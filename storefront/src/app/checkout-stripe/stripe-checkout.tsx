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
    
    // Create payment session directly with Medusa backend
    const initializePayment = async () => {
      try {
        // First, retrieve the full cart object
        console.log('Retrieving cart:', cartId)
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
        
        setDebugInfo({ providers: providers.payment_providers?.map((p: any) => ({ id: p.id, enabled: p.is_enabled })) || [] })
        
        // Initialize payment session with Stripe - passing cart object
        console.log('Creating payment session for cart:', cartId)
        const paymentCollection = await medusa.store.payment.initiatePaymentSession(
          cart,  // Pass cart object, not cart ID
          { 
            provider_id: 'stripe'
          }
        )
        
        // Extract client secret from the Stripe session
        const stripeSession = paymentCollection.payment_sessions?.find(
          (session: any) => session.provider_id === 'stripe'
        )
        
        if (!stripeSession?.data?.client_secret) {
          throw new Error('Failed to create Stripe payment session - no client secret received')
        }
        
        const clientSecret = stripeSession.data.client_secret
        console.log('Payment session created via Medusa')
        console.log('Client secret received:', clientSecret.substring(0, 20) + '...')
        
        setClientSecret(clientSecret)
        setDebugInfo({
          providers: providers.payment_providers?.map((p: any) => ({ id: p.id, enabled: p.is_enabled })) || [],
          paymentSessionId: stripeSession.id,
          hasClientSecret: !!clientSecret
        })
      } catch (err: any) {
        console.error('Payment initialization error:', err)
        setError(err.message)
        setDebugInfo({ error: err.message, stack: err.stack })
      } finally {
        setLoading(false)
      }
    }
    
    initializePayment()
  }, [amount, cartId, email])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Initializing payment...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Payment initialization failed</p>
        <p className="text-sm mt-1">{error}</p>
        {debugInfo && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700">
            <p>Debug Info:</p>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
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