'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { initializeMedusaPayment, addShippingAddress, addShippingMethod, createPaymentCollection, createPaymentSession, checkBackendReady } from '@/services/medusaBackendService'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'

// Initialize Stripe
const stripePromise = typeof window !== 'undefined' 
  ? loadStripe('pk_live_51RAMT2CHc12x7sCzv9MxCfz8HBj76Js5MiRCa0F0o3xVOJJ0LS7pRNhDxIJZf5mQQBW6vD5h3cQzI0B5vhLSl6Y200YY9iXR7h')
  : null

// Payment Form Component
function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      })

      if (result.error) {
        setError(result.error.message || 'Payment failed')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
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
    </form>
  )
}

export default function SimpleStripeCheckout() {
  const router = useRouter()
  const { cart, isLoading } = useMedusaCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initializingPayment, setInitializingPayment] = useState(false)
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  
  const [shippingInfo, setShippingInfo] = useState({
    email: '',
    first_name: '',
    last_name: '',
    address_1: '',
    city: '',
    state: '',
    postal_code: '',
    phone: ''
  })

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cart?.id) {
      setError('No cart found')
      return
    }

    setInitializingPayment(true)
    setError(null)

    try {
      // Optional health check - don't block checkout if it fails
      // The actual API calls will fail with proper errors if backend is down
      await checkBackendReady().catch(err => {
        console.log('Health check skipped:', err)
      })
      // Step 1: Add shipping address
      console.log('Adding shipping address...')
      await addShippingAddress(cart.id, {
        ...shippingInfo,
        country_code: 'us'
      })

      // Step 2: Add shipping method
      console.log('Adding shipping method...')
      await addShippingMethod(cart.id, 'Standard Shipping', 10)

      // Step 3: Create payment collection
      console.log('Creating payment collection...')
      const paymentCollection = await createPaymentCollection(cart.id)
      
      if (!paymentCollection) {
        throw new Error('Failed to create payment collection')
      }

      // Step 4: Create payment session with Stripe (using custom endpoint to fix 100x bug)
      console.log('Creating payment session with custom endpoint to fix 100x bug...')
      let paymentSession
      try {
        paymentSession = await createPaymentSession(paymentCollection.id, cart.id)
      } catch (sessionError: any) {
        console.error('Payment session error:', sessionError)
        throw new Error(sessionError.message || 'Failed to create payment session')
      }
      
      if (!paymentSession?.client_secret) {
        throw new Error('Payment session created but missing client secret')
      }

      setClientSecret(paymentSession.client_secret)
      setStep('payment')
    } catch (err: any) {
      console.error('Checkout error:', err)
      
      // Clear cart on payment/session errors to prevent stale data
      if (err.message?.includes('payment') || err.message?.includes('session')) {
        console.log('Clearing cart due to payment/session error')
        localStorage.removeItem('medusa_cart_id')
        localStorage.removeItem('cart_id')
        localStorage.removeItem('last_cart_items')
        localStorage.removeItem('checkout_email')
        
        // Show error and suggest refresh
        setError(err.message + '\n\nPlease refresh the page to start a new checkout.')
      } else {
        setError(err.message || 'Failed to initialize payment')
      }
    } finally {
      setInitializingPayment(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h2 className="text-2xl font-light mb-4">Your cart is empty</h2>
          <Button onClick={() => router.push('/collections')} className="w-full">
            Continue Shopping
          </Button>
        </Card>
      </div>
    )
  }

  const total = (cart.total || 0) / 100 // Convert from cents

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-light mb-8">Checkout</h1>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          <div className="space-y-2">
            {cart.items.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>{item.title} x {item.quantity}</span>
                <span>${((item.unit_price || 0) / 100).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>

        {step === 'shipping' ? (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Shipping Information</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleShippingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={shippingInfo.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={shippingInfo.last_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address_1"
                  value={shippingInfo.address_1}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    required
                    maxLength={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={shippingInfo.postal_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={initializingPayment}
              >
                {initializingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Payment</h2>
            {clientSecret && stripePromise && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm clientSecret={clientSecret} />
              </Elements>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}