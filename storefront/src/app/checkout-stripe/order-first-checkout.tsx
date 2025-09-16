'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { STRIPE_PUBLISHABLE_KEY, isValidStripeKey } from '@/lib/stripe-config'

// Load Stripe
const stripePromise = isValidStripeKey(STRIPE_PUBLISHABLE_KEY) 
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null)

interface OrderFirstCheckoutProps {
  cartData: {
    email: string
    items: Array<{
      title: string
      variant_id?: string
      quantity: number
      unit_price: number
    }>
    shipping_address: {
      first_name: string
      last_name: string
      address_1: string
      address_2?: string
      city: string
      postal_code: string
      province: string
      country_code: string
    }
    amount: number
  }
  onSuccess: () => void
}

function PaymentForm({ orderId, amount, onSuccess }: { orderId: string, amount: number, onSuccess: () => void }) {
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
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // If we get here without redirect, payment succeeded
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        window.location.href = `/checkout/success?order_id=${orderId}&payment_intent=${paymentIntent.id}`
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

export function OrderFirstCheckout({ cartData, onSuccess }: OrderFirstCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createOrder = async () => {
      try {
        console.log('Creating order-first checkout...')
        
        // Call the backend create-order endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/checkout/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
          },
          body: JSON.stringify(cartData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create order')
        }

        const data = await response.json()
        
        if (!data.client_secret || !data.order_id) {
          throw new Error('Invalid response from server')
        }

        console.log('Order created:', data.order_id)
        setClientSecret(data.client_secret)
        setOrderId(data.order_id)
      } catch (err: any) {
        console.error('Order creation error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    createOrder()
  }, [cartData])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Creating order...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p className="font-medium">Order creation failed</p>
        <p className="text-sm mt-1">{error}</p>
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

  if (!clientSecret || !orderId) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
        <p>Unable to initialize payment. Please try again.</p>
      </div>
    )
  }

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
      }}
    >
      <PaymentForm 
        orderId={orderId}
        amount={cartData.amount} 
        onSuccess={onSuccess} 
      />
    </Elements>
  )
}