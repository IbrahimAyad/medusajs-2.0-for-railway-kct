'use client'

import { useState } from 'react'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import medusaClient from '@/lib/medusa-client'
import { stripePromise } from '@/lib/stripe'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { ChevronLeft, CreditCard, Check, Package, Truck } from 'lucide-react'

// Main checkout component
export function CheckoutForm() {
  const { cart, setEmail, setAddresses, createPaymentSessions, setPaymentSession, completeCart, loading } = useMedusaCart()
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping')
  const [orderData, setOrderData] = useState<any>(null)
  const [email, setEmailState] = useState('')
  const [shippingAddress, setShippingAddress] = useState({
    first_name: '',
    last_name: '',
    address_1: '',
    address_2: '',
    city: '',
    country_code: 'us',
    province: '',
    postal_code: '',
    phone: '',
  })

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-light mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-4">Add some items to checkout</p>
        <a href="/collections" className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">
          Continue Shopping
        </a>
      </div>
    )
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Update cart with email and shipping address
      await setEmail(email)
      await setAddresses(shippingAddress)

      // Add shipping method
      const shippingOptions = await medusaClient.shippingOptions.listCartOptions(cart.id)
      if (shippingOptions.shipping_options && shippingOptions.shipping_options.length > 0) {
        await medusaClient.carts.addShippingMethod(cart.id, {
          option_id: shippingOptions.shipping_options[0].id,
        })
      }

      // Skip payment sessions - handled in payment step with order-first approach
      setStep('payment')
    } catch (error) {
      console.error('Shipping update failed:', error)
    }
  }

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Steps */}
        <div className="lg:col-span-2">
          {/* Progress Indicator */}
          <div className="flex items-center mb-8">
            <div className={`flex items-center ${step !== 'shipping' ? 'text-green-600' : 'text-black'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                step !== 'shipping' ? 'bg-green-600 border-green-600 text-white' : 'border-current'
              }`}>
                {step !== 'shipping' ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Shipping</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
            
            <div className={`flex items-center ${step === 'confirmation' ? 'text-green-600' : step === 'payment' ? 'text-black' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                step === 'confirmation' ? 'bg-green-600 border-green-600 text-white' : 'border-current'
              }`}>
                {step === 'confirmation' ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">Payment</span>
            </div>
            
            <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
            
            <div className={`flex items-center ${step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                step === 'confirmation' ? 'bg-green-600 border-green-600 text-white' : 'border-current'
              }`}>
                {step === 'confirmation' ? <Check className="w-4 h-4" /> : '3'}
              </div>
              <span className="ml-2 text-sm font-medium">Confirmation</span>
            </div>
          </div>

          {step === 'shipping' && (
            <form onSubmit={handleShippingSubmit} className="space-y-6">
              <h2 className="text-2xl font-light mb-6">Shipping Information</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmailState(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={shippingAddress.first_name}
                    onChange={(e) => setShippingAddress({...shippingAddress, first_name: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={shippingAddress.last_name}
                    onChange={(e) => setShippingAddress({...shippingAddress, last_name: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={shippingAddress.address_1}
                  onChange={(e) => setShippingAddress({...shippingAddress, address_1: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Apartment, suite, etc. (optional)</label>
                <input
                  type="text"
                  value={shippingAddress.address_2}
                  onChange={(e) => setShippingAddress({...shippingAddress, address_2: e.target.value})}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                  placeholder="Apt 4B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={shippingAddress.province}
                    onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                    placeholder="NY"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                    placeholder="12345"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:border-black"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </form>
          )}

          {step === 'payment' && (
            <Elements stripe={stripePromise}>
              <PaymentForm 
                cart={cart}
                onSuccess={(order) => {
                  setOrderData(order)
                  setStep('confirmation')
                }}
                onBack={() => setStep('shipping')}
              />
            </Elements>
          )}

          {step === 'confirmation' && (
            <OrderConfirmation order={orderData} email={email} />
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  {item.variant?.product?.thumbnail && (
                    <img
                      src={item.variant.product.thumbnail}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.variant?.title}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              {cart.shipping_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatPrice(cart.shipping_total)}</span>
                </div>
              )}
              {cart.tax_total > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(cart.tax_total)}</span>
                </div>
              )}
              {cart.discount_total > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(cart.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Payment form with Stripe - Order-First Flow
function PaymentForm({ cart, onSuccess, onBack }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return

    setProcessing(true)
    setError(null)

    try {
      // STEP 1: Create order FIRST (before payment)
      console.log('Step 1: Creating order before payment...')
      const createOrderResponse = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: cart.id
        })
      })

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json()
        throw new Error(errorData.error || 'Failed to create order')
      }

      const orderData = await createOrderResponse.json()
      console.log('✅ Order created successfully:', orderData.order_id)

      // STEP 2: Process payment using the order's client_secret
      console.log('Step 2: Processing payment...')
      const paymentResult = await stripe.confirmCardPayment(orderData.client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (paymentResult.error) {
        console.error('❌ Payment failed:', paymentResult.error.message)
        setError(paymentResult.error.message || 'Payment failed')
      } else {
        console.log('✅ Payment successful!')
        
        // STEP 3: Payment successful - webhook will update order to completed
        // Order already exists, just needs status update via webhook
        onSuccess({
          id: orderData.order_id,
          payment_intent_id: paymentResult.paymentIntent.id,
          status: 'paid'
        })
      }
    } catch (error: any) {
      console.error('Payment processing failed:', error)
      setError(error.message || 'Payment processing failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePayment} className="space-y-6">
      <h2 className="text-2xl font-light mb-6">Payment Information</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="border rounded-lg p-4">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 py-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          disabled={processing}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 bg-black text-white py-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          {processing ? 'Processing...' : `Pay ${(cart.total / 100).toFixed(2)}`}
        </button>
      </div>
    </form>
  )
}

// Order confirmation
function OrderConfirmation({ order, email }: any) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-3xl font-light mb-2">Order Confirmed!</h2>
      <p className="text-gray-600 mb-4">Your order has been created and payment processed successfully</p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
        <p className="text-sm text-gray-600 mb-2">Order number</p>
        <p className="font-mono text-sm mb-4">{order?.id || 'Processing...'}</p>
        
        {order?.payment_intent_id && (
          <>
            <p className="text-sm text-gray-600 mb-2">Payment ID</p>
            <p className="font-mono text-xs mb-4 text-gray-500">{order.payment_intent_id}</p>
          </>
        )}
        
        <p className="text-sm text-gray-600 mb-2">Status</p>
        <p className="text-sm mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {order?.status === 'paid' ? 'Payment Confirmed' : 'Processing'}
          </span>
        </p>
        
        <p className="text-sm text-gray-600 mb-2">Email</p>
        <p className="text-sm mb-4">{email}</p>
        
        <p className="text-sm text-gray-600 mb-2">Estimated delivery</p>
        <p className="text-sm flex items-center gap-2">
          <Truck className="w-4 h-4" />
          3-5 business days
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
        <p className="text-sm text-blue-800">
          <strong>Professional Order System:</strong> Your order was created before payment processing, 
          ensuring it appears in our admin system immediately. You'll receive confirmation emails shortly.
        </p>
      </div>
      
      <div className="flex gap-4 max-w-md mx-auto">
        <a
          href="/collections"
          className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Continue Shopping
        </a>
        <a
          href="/orders"
          className="flex-1 bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          View Order
        </a>
      </div>
    </div>
  )
}