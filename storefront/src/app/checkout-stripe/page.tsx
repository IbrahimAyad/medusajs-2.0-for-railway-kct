'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { addShippingAddress, addShippingMethod, createPaymentCollection, createPaymentSession, checkBackendReady } from '@/services/medusaBackendService'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react'
import { ManualPaymentForm } from './manual-payment'
import { StripeCheckout } from './stripe-checkout'
import { SimpleStripeForm } from './simple-stripe-form'

// Initialize Stripe
import { STRIPE_PUBLISHABLE_KEY, isValidStripeKey } from '@/lib/stripe-config'

const stripePromise = typeof window !== 'undefined' && isValidStripeKey(STRIPE_PUBLISHABLE_KEY)
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null

// Payment Form Component
function CheckoutForm({ clientSecret, cartId }: { clientSecret: string, cartId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  
  // Debug logging
  useEffect(() => {
    console.log('CheckoutForm mounted:', {
      hasStripe: !!stripe,
      hasElements: !!elements,
      clientSecret: clientSecret?.substring(0, 20) + '...',
      cartId
    })
  }, [stripe, elements, clientSecret, cartId])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setError('Payment system not ready. Please wait a moment and try again.')
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // First, check if the PaymentElement is actually mounted
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message || 'Please fill in your payment details')
      }
      
      // NOTE: This will use whatever capture_method is set on the PaymentIntent
      // If backend sets capture_method: 'manual', payment will be authorized but not captured
      // If backend sets capture_method: 'automatic', payment will be captured immediately
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?cart_id=${cartId}`,
        },
      })

      if (result.error) {
        // More specific error messages based on error types
        let errorMessage = result.error.message || 'Payment failed'
        
        if (result.error.type === 'card_error') {
          errorMessage = `Card Error: ${result.error.message}`
        } else if (result.error.type === 'validation_error') {
          errorMessage = `Please check your payment details: ${result.error.message}`
        } else if (result.error.type === 'api_connection_error') {
          errorMessage = 'Connection error. Please check your internet connection and try again.'
        } else if (result.error.type === 'api_error') {
          errorMessage = 'Payment service temporarily unavailable. Please try again in a moment.'
        } else if (result.error.type === 'authentication_error') {
          errorMessage = 'Payment authentication failed. Please refresh the page and try again.'
        } else if (result.error.type === 'rate_limit_error') {
          errorMessage = 'Too many payment attempts. Please wait a moment before trying again.'
        }
        
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="min-h-[200px]">
        <PaymentElement 
          options={{
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                email: '',
              }
            }
          }}
        />
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full"
        size="lg"
      >
        {!stripe || !elements ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading payment...
          </>
        ) : processing ? (
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

export default function StripeCheckoutPage() {
  const router = useRouter()
  const { cart, isLoading } = useMedusaCart()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initializingPayment, setInitializingPayment] = useState(false)
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  
  // Debug logging
  useEffect(() => {
    console.log('StripeCheckoutPage state:', {
      step,
      hasClientSecret: !!clientSecret,
      hasStripePromise: !!stripePromise,
      clientSecretLength: clientSecret?.length,
      clientSecretPreview: clientSecret?.substring(0, 30),
      stripePromiseValue: stripePromise,
      error
    })
    
    // Also log to page for visibility
    if (typeof window !== 'undefined') {
      (window as any).__CHECKOUT_DEBUG = {
        step,
        clientSecret: !!clientSecret,
        stripePromise: !!stripePromise,
        timestamp: new Date().toISOString()
      }
    }
  }, [step, clientSecret, error])
  
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
      // Save cart data to localStorage for success page
      const cartDataForSuccess = {
        items: cart.items.map((item: any) => ({
          name: item.title,
          size: item.variant?.title || 'One Size',
          quantity: item.quantity,
          price: `$${((item.unit_price || 0) / 100).toFixed(2)}`
        })),
        total: `$${total.toFixed(2)}`
      };
      localStorage.setItem('last_cart_items', JSON.stringify(cartDataForSuccess));
      localStorage.setItem('checkout_email', shippingInfo.email);
      
      // Step 1: Add shipping address
      console.log('Adding shipping address...')
      await addShippingAddress(cart.id, {
        ...shippingInfo,
        country_code: 'us'
      })

      // Step 2: Add shipping method (CRITICAL - must succeed for checkout)
      console.log('Adding shipping method...')
      try {
        const shippingResult = await addShippingMethod(cart.id, 'Free Shipping', 0)
        
        if (!shippingResult?.success) {
          throw new Error('Failed to add shipping method. The checkout cannot proceed without shipping. Please refresh and try again.')
        }
        
        console.log('Shipping method added successfully:', shippingResult)
      } catch (shippingError: any) {
        console.error('Shipping method failed:', shippingError)
        
        // DISABLED: Cart deletion moved to after order confirmation
        // localStorage.removeItem('medusa_cart_id')
        // localStorage.removeItem('cart_id')
        
        throw new Error(
          shippingError.message || 
          'Unable to add shipping method. Please refresh the page and try again.'
        )
      }

      // SKIP Medusa payment collection/session to avoid duplicate payment intents
      // We'll use our custom Stripe integration instead
      console.log('Skipping Medusa payment session - using direct Stripe integration')
      
      // Just move to payment step - our StripeCheckout component will handle payment
      console.log('Moving to payment step')
      setStep('payment')
    } catch (err: any) {
      console.error('Checkout error:', err)
      
      // DISABLED: Cart deletion moved to after order confirmation
      // if (err.message?.includes('payment') || err.message?.includes('session')) {
      //   console.log('Clearing cart due to payment/session error')
      //   localStorage.removeItem('medusa_cart_id')
      //   localStorage.removeItem('cart_id')
      //   localStorage.removeItem('last_cart_items')
      //   localStorage.removeItem('checkout_email')
      //   
      //   // Show error and suggest refresh
      //   setError(err.message + '\n\nPlease refresh the page to start a new checkout.')
      // } else {
        setError(err.message || 'Failed to initialize payment')
      // }
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

  // Calculate pricing details
  const subtotal = (cart.subtotal || 0) / 100
  const shippingCost = 0.00 // FREE shipping
  const taxRate = 0.06 // 6% tax rate (adjust based on location)
  const taxAmount = subtotal * taxRate
  const total = subtotal + shippingCost + taxAmount

  // DISABLED: Debug function - cart clearing disabled during webhook fix
  const handleClearCache = () => {
    // DISABLED: Cart deletion moved to after order confirmation
    // localStorage.clear()
    // sessionStorage.clear()
    // document.cookie.split(";").forEach(c => {
    //   document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;'
    // })
    // window.location.reload()
    console.log('Cache clearing disabled during webhook fix')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-light">Checkout</h1>
          {/* Debug button - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={handleClearCache}
              className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Clear all browser cache and reload"
            >
              Clear Cache (Debug)
            </button>
          )}
        </div>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cart.items.map(item => (
              <div key={item.id} className="border-b pb-3">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.thumbnail ? (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          {item.variant?.title && (
                            <p>Size: {item.variant.title}</p>
                          )}
                          {item.variant?.sku && (
                            <p className="text-xs">SKU: {item.variant.sku}</p>
                          )}
                          <p>Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${((item.unit_price || 0) / 100).toFixed(2)}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            ${((item.unit_price || 0) / 100 * item.quantity).toFixed(2)} total
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
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
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {!clientSecret && (
              <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                <p className="text-sm">Initializing payment... Please wait.</p>
                <p className="text-xs mt-2">If this takes more than a few seconds, please refresh the page.</p>
              </div>
            )}
            
            {!stripePromise && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                <p className="text-sm">Error: Stripe failed to load. Please check your internet connection and refresh the page.</p>
              </div>
            )}
            
            {/* Try proper Stripe checkout first, fallback to manual if needed */}
            <div className="space-y-4">
              <StripeCheckout
                amount={total * 100} // Convert to cents
                cartId={cart.id}
                email={shippingInfo.email}
                onSuccess={() => {
                  // DISABLED: Cart deletion moved to after order confirmation - let success page handle it
                  router.push(`/checkout/success?cart_id=${cart.id}`)
                }}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Alternative payment options</span>
                </div>
              </div>
              
              <details className="group mb-4">
                <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                  💳 Use Simple Card Form (if Payment Element fails)
                </summary>
                <div className="mt-4">
                  <SimpleStripeForm 
                    amount={total * 100}
                    cartId={cart.id}
                    email={shippingInfo.email}
                    onSuccess={() => {
                      // DISABLED: Cart deletion moved to after order confirmation
                      // localStorage.removeItem('medusa_cart_id')
                      router.push('/checkout/success')
                    }}
                  />
                </div>
              </details>
              
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  Having issues? Use manual test payment
                </summary>
                <div className="mt-4">
                  <ManualPaymentForm 
                    cartId={cart.id}
                    amount={total * 100}
                    onSuccess={(order) => {
                      router.push('/checkout/success')
                    }}
                  />
                </div>
              </details>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}