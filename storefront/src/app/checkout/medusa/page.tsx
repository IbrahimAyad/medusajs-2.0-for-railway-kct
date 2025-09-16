'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMedusaCart } from '@/contexts/MedusaCartContext'
import { 
  addShippingAddress, 
  addShippingMethod, 
  initializeMedusaPayment,
  completeMedusaOrder 
} from '@/services/medusaBackendService'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Package, ArrowLeft, Check, CreditCard, Truck, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Step indicator component
function StepIndicator({ currentStep }: { currentStep: 'shipping' | 'payment' | 'confirmation' }) {
  const steps = [
    { key: 'shipping', label: 'Shipping', icon: MapPin },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'confirmation', label: 'Confirmation', icon: Check }
  ]
  
  const currentIndex = steps.findIndex(s => s.key === currentStep)
  
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = index === currentIndex
        const isCompleted = index < currentIndex
        
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${isActive ? 'bg-burgundy-600 text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-400'}
              `}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-burgundy-600' : 
                isCompleted ? 'text-green-600' : 
                'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-4 w-16 h-0.5 ${
                isCompleted ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Shipping form component
function ShippingForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'us'
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            required
            value={formData.first_name}
            onChange={e => setFormData({...formData, first_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            required
            value={formData.last_name}
            onChange={e => setFormData({...formData, last_name: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          required
          value={formData.address_1}
          onChange={e => setFormData({...formData, address_1: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Apartment, suite, etc. (optional)</label>
        <input
          type="text"
          value={formData.address_2}
          onChange={e => setFormData({...formData, address_2: e.target.value})}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={e => setFormData({...formData, city: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <input
            type="text"
            required
            maxLength={2}
            placeholder="NY"
            value={formData.state}
            onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ZIP Code</label>
          <input
            type="text"
            required
            pattern="[0-9]{5}"
            value={formData.postal_code}
            onChange={e => setFormData({...formData, postal_code: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy-500"
          />
        </div>
      </div>
      
      <div className="mt-6">
        <Button type="submit" className="w-full">
          Continue to Payment
        </Button>
      </div>
    </form>
  )
}

// Payment form component (uses Stripe Elements)
function PaymentForm({ 
  clientSecret, 
  onSuccess 
}: { 
  clientSecret: string
  onSuccess: (paymentIntent: any) => void 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return
    
    setProcessing(true)
    setError(null)
    
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/medusa/success`,
      },
      redirect: 'if_required'
    })
    
    if (result.error) {
      setError(result.error.message || 'Payment failed')
      setProcessing(false)
    } else {
      onSuccess(result.paymentIntent)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full"
      >
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Processing...
          </div>
        ) : (
          'Complete Order'
        )}
      </Button>
    </form>
  )
}

// Main checkout page
export default function MedusaCheckoutPage() {
  const router = useRouter()
  const { cart, cartId, getSubtotal } = useMedusaCart()
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentCollectionId, setPaymentCollectionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  // Redirect if no cart
  useEffect(() => {
    if (!cart || !cart.items || cart.items.length === 0) {
      router.push('/shop/catalog')
    }
  }, [cart, router])
  
  const handleShippingSubmit = async (shippingData: any) => {
    if (!cartId) return
    
    setLoading(true)
    try {
      // Add shipping address
      const addressResult = await addShippingAddress(cartId, shippingData)
      if (!addressResult) throw new Error('Failed to add shipping address')
      
      // Add shipping method (Standard Shipping - $10)
      const shippingResult = await addShippingMethod(cartId, 'Standard Shipping', 10)
      if (!shippingResult) throw new Error('Failed to add shipping method')
      
      // Initialize payment
      const paymentResult = await initializeMedusaPayment(cartId)
      if (!paymentResult || !paymentResult.client_secret) {
        throw new Error('Failed to initialize payment')
      }
      
      setClientSecret(paymentResult.client_secret)
      setPaymentCollectionId(paymentResult.payment_collection_id)
      setStep('payment')
      
    } catch (error: any) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Failed to process shipping information')
    } finally {
      setLoading(false)
    }
  }
  
  const handlePaymentSuccess = async (paymentIntent: any) => {
    if (!cartId || !paymentCollectionId) return
    
    setLoading(true)
    try {
      // Complete the order
      const orderResult = await completeMedusaOrder(
        cartId, 
        paymentIntent.id, 
        paymentCollectionId
      )
      
      if (!orderResult || !orderResult.order_id) {
        throw new Error('Failed to complete order')
      }
      
      setOrderId(orderResult.order_id)
      setOrderComplete(true)
      setStep('confirmation')
      
      // Clear cart from localStorage
      localStorage.removeItem('medusa_cart_id')
      
      toast.success('Order completed successfully!')
      
    } catch (error: any) {
      console.error('Order completion error:', error)
      toast.error(error.message || 'Failed to complete order')
    } finally {
      setLoading(false)
    }
  }
  
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <Link href="/shop/catalog">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const subtotal = getSubtotal()
  const shipping = 10
  const total = subtotal + shipping
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/shop/catalog" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Catalog
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>
        
        {/* Step Indicator */}
        <StepIndicator currentStep={step} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {step === 'shipping' && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                  <ShippingForm onSubmit={handleShippingSubmit} />
                </>
              )}
              
              {step === 'payment' && clientSecret && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Payment</h2>
                  <Elements 
                    stripe={stripePromise} 
                    options={{ 
                      clientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#722F37',
                        }
                      }
                    }}
                  >
                    <PaymentForm 
                      clientSecret={clientSecret}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                </>
              )}
              
              {step === 'confirmation' && orderComplete && (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <Check className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Order Confirmed!</h2>
                  <p className="text-gray-600 mb-4">
                    Thank you for your purchase. Your order has been successfully placed.
                  </p>
                  {orderId && (
                    <p className="text-sm text-gray-500 mb-6">
                      Order ID: <span className="font-mono">{orderId}</span>
                    </p>
                  )}
                  <div className="space-x-4">
                    <Link href="/shop/catalog">
                      <Button variant="outline">Continue Shopping</Button>
                    </Link>
                    <Link href="/account/orders">
                      <Button>View Orders</Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
              
              {/* Items */}
              <div className="space-y-3 mb-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <p>Subtotal</p>
                  <p>${subtotal.toFixed(2)}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>Shipping</p>
                  <p>${shipping.toFixed(2)}</p>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <p>Total</p>
                    <p>${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              {/* Security Badge */}
              <div className="mt-6 p-3 bg-gray-50 rounded-lg text-center">
                <div className="flex items-center justify-center text-gray-600 text-xs">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Secure payment powered by Stripe
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}