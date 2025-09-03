# Medusa Checkout Implementation Guide

## Overview
This guide provides complete implementation instructions for adding Medusa checkout functionality to the KCT Menswear frontend.

## Architecture
- **201 Medusa Products**: Use Medusa checkout flow
- **28 Core Products**: Continue using direct Stripe checkout
- **Dual Cart System**: Separate carts for each product type

## IMPORTANT: API Key Requirement

All store endpoints require a publishable API key. Get your key first:

```javascript
// Get publishable API key (run once from admin)
// Note: This requires admin authentication (use session cookie from browser)
const response = await fetch('https://backend-production-7441.up.railway.app/admin/create-api-key', {
  method: 'POST',
  headers: {
    'Cookie': 'connect.sid=YOUR_SESSION_COOKIE' // Get from browser DevTools
  }
});
const { api_key } = await response.json();
// Save this key in your environment variables as NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

// Alternative: Use this pre-generated key for testing
// NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_01JFSH5K7Y2E4H3M9XNV8ZQR6T
```

Then include it in all store API requests:
```javascript
headers: {
  'Content-Type': 'application/json',
  'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
}
```

## API Endpoints

### 1. Product Fetching
```javascript
// Get all Medusa products with pagination
GET https://backend-production-7441.up.railway.app/store/products
Query params:
  - limit: number (default: 20)
  - offset: number (default: 0)
  - category: string (optional)
  - search: string (optional)
  - min_price: number (optional)
  - max_price: number (optional)
  - sort: string (default: "created_at")

// Get single product
POST https://backend-production-7441.up.railway.app/store/products
Body: { product_id: "prod_..." }
```

### 2. Cart Operations
```javascript
// Create cart
POST https://backend-production-7441.up.railway.app/store/cart-operations
Body: {
  action: "create",
  customer_email: "customer@email.com"
}

// Add item to cart
POST https://backend-production-7441.up.railway.app/store/cart-operations
Body: {
  action: "add_item",
  cart_id: "cart_...",
  variant_id: "variant_...",
  quantity: 1
}

// Update item quantity
POST https://backend-production-7441.up.railway.app/store/cart-operations
Body: {
  action: "update_item",
  cart_id: "cart_...",
  item_id: "item_...",
  quantity: 2
}

// Remove item
POST https://backend-production-7441.up.railway.app/store/cart-operations
Body: {
  action: "remove_item",
  cart_id: "cart_...",
  item_id: "item_..."
}

// Get cart
GET https://backend-production-7441.up.railway.app/store/cart-operations?cart_id=cart_...
```

### 3. Checkout Flow
```javascript
// Step 1: Add shipping address
POST https://backend-production-7441.up.railway.app/store/checkout
Body: {
  action: "add_shipping_address",
  cart_id: "cart_...",
  first_name: "John",
  last_name: "Doe",
  address_1: "123 Main St",
  address_2: "",
  city: "New York",
  state: "NY",
  postal_code: "10001",
  country_code: "us",
  phone: "555-0100",
  email: "john@example.com"
}

// Step 2: Add shipping method
POST https://backend-production-7441.up.railway.app/store/checkout
Body: {
  action: "add_shipping_method",
  cart_id: "cart_...",
  shipping_method: "Standard Shipping",
  shipping_amount: 10
}

// Step 3: Initialize payment
POST https://backend-production-7441.up.railway.app/store/checkout
Body: {
  action: "initialize_payment",
  cart_id: "cart_..."
}
Response: {
  client_secret: "pi_..._secret_...",
  amount: 150.00,
  payment_collection_id: "...",
  payment_session_id: "..."
}

// Step 4: Complete order (after Stripe payment)
POST https://backend-production-7441.up.railway.app/store/checkout
Body: {
  action: "complete_order",
  cart_id: "cart_...",
  payment_intent_id: "pi_...",
  payment_collection_id: "..."
}
```

## Frontend Implementation

### 1. Install Stripe
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Cart Context for Medusa Products
```javascript
// contexts/MedusaCartContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const MedusaCartContext = createContext();

export function MedusaCartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [cartId, setCartId] = useState(null);
  const apiKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

  useEffect(() => {
    // Load cart ID from localStorage
    const savedCartId = localStorage.getItem('medusa_cart_id');
    if (savedCartId) {
      fetchCart(savedCartId);
    }
  }, []);

  const createCart = async (email) => {
    const response = await fetch('https://backend-production-7441.up.railway.app/store/cart-operations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': apiKey
      },
      body: JSON.stringify({ 
        action: 'create',
        customer_email: email 
      })
    });
    const data = await response.json();
    setCart(data.cart);
    setCartId(data.cart_id);
    localStorage.setItem('medusa_cart_id', data.cart_id);
    return data.cart;
  };

  const addToCart = async (variantId, quantity = 1) => {
    let currentCartId = cartId;
    if (!currentCartId) {
      const newCart = await createCart();
      currentCartId = newCart.id;
    }

    const response = await fetch('https://backend-production-7441.up.railway.app/store/cart-operations', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': apiKey
      },
      body: JSON.stringify({
        action: 'add_item',
        cart_id: currentCartId,
        variant_id: variantId,
        quantity
      })
    });
    const data = await response.json();
    setCart(data.cart);
    return data.cart;
  };

  const fetchCart = async (id) => {
    const response = await fetch(`https://backend-production-7441.up.railway.app/store/cart-operations?cart_id=${id}`, {
      headers: {
        'x-publishable-api-key': apiKey
      }
    });
    const data = await response.json();
    if (data.success) {
      setCart(data.cart);
    }
  };

  return (
    <MedusaCartContext.Provider value={{
      cart,
      cartId,
      createCart,
      addToCart,
      fetchCart
    }}>
      {children}
    </MedusaCartContext.Provider>
  );
}

export const useMedusaCart = () => useContext(MedusaCartContext);
```

### 3. Product Display Component
```javascript
// components/MedusaProductCard.js
import { useMedusaCart } from '../contexts/MedusaCartContext';

export function MedusaProductCard({ product }) {
  const { addToCart } = useMedusaCart();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]);

  const handleAddToCart = async () => {
    await addToCart(selectedVariant.id, 1);
    // Show success message
  };

  return (
    <div className="product-card">
      <img src={product.thumbnail} alt={product.title} />
      <h3>{product.title}</h3>
      <p className="price">${product.price}</p>
      
      {product.variants?.length > 1 && (
        <select onChange={(e) => setSelectedVariant(product.variants.find(v => v.id === e.target.value))}>
          {product.variants.map(variant => (
            <option key={variant.id} value={variant.id}>
              {variant.title}
            </option>
          ))}
        </select>
      )}
      
      <button onClick={handleAddToCart}>
        Add to Cart
      </button>
    </div>
  );
}
```

### 4. Checkout Page
```javascript
// pages/MedusaCheckout.js
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMedusaCart } from '../contexts/MedusaCartContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setProcessing(true);
    
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/order-confirmation',
      },
      redirect: 'if_required'
    });
    
    if (result.error) {
      console.error(result.error);
      setProcessing(false);
    } else {
      onSuccess(result.paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function MedusaCheckout() {
  const { cart, cartId } = useMedusaCart();
  const [clientSecret, setClientSecret] = useState(null);
  const [step, setStep] = useState('shipping');

  const handleShippingSubmit = async (shippingData) => {
    // Add shipping address
    await fetch('https://backend-production-7441.up.railway.app/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_shipping_address',
        cart_id: cartId,
        ...shippingData
      })
    });

    // Add shipping method
    await fetch('https://backend-production-7441.up.railway.app/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_shipping_method',
        cart_id: cartId,
        shipping_method: 'Standard Shipping',
        shipping_amount: 10
      })
    });

    // Initialize payment
    const paymentResponse = await fetch('https://backend-production-7441.up.railway.app/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'initialize_payment',
        cart_id: cartId
      })
    });
    
    const paymentData = await paymentResponse.json();
    setClientSecret(paymentData.client_secret);
    setStep('payment');
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    // Complete order
    const response = await fetch('https://backend-production-7441.up.railway.app/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete_order',
        cart_id: cartId,
        payment_intent_id: paymentIntent.id,
        payment_collection_id: paymentIntent.metadata.payment_collection_id
      })
    });
    
    const orderData = await response.json();
    
    // Clear cart and redirect
    localStorage.removeItem('medusa_cart_id');
    window.location.href = `/order-confirmation?order_id=${orderData.order_id}`;
  };

  return (
    <div className="checkout-container">
      {step === 'shipping' && (
        <ShippingForm onSubmit={handleShippingSubmit} />
      )}
      
      {step === 'payment' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            clientSecret={clientSecret}
            onSuccess={handlePaymentSuccess}
          />
        </Elements>
      )}
    </div>
  );
}
```

### 5. Mixed Cart Warning
```javascript
// Show warning when user has items in both carts
function CartWarning() {
  const { cart: medusaCart } = useMedusaCart();
  const { cart: coreCart } = useCoreCart();

  if (medusaCart?.items?.length && coreCart?.items?.length) {
    return (
      <div className="alert alert-warning">
        <p>You have items from different product collections.</p>
        <p>You'll need to checkout separately:</p>
        <ul>
          <li>New Arrivals (201 items) - Checkout via Medusa</li>
          <li>Core Collection (28 items) - Checkout via Stripe</li>
        </ul>
      </div>
    );
  }
  return null;
}
```

## Testing Guide

### 1. Test Cart Operations
```javascript
// Test creating cart and adding items
async function testCart() {
  // Create cart
  const cartResponse = await fetch('https://backend-production-7441.up.railway.app/store/cart-operations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      customer_email: 'test@example.com'
    })
  });
  const { cart_id } = await cartResponse.json();
  console.log('Created cart:', cart_id);

  // Add item
  const addResponse = await fetch('https://backend-production-7441.up.railway.app/store/cart-operations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_item',
      cart_id,
      variant_id: 'variant_01JFSF5ZCKW6KFRZ3TG3QNAXMJ', // Use actual variant ID
      quantity: 1
    })
  });
  const updatedCart = await addResponse.json();
  console.log('Cart with item:', updatedCart);
}
```

### 2. Test Checkout Flow
```javascript
// Test complete checkout
async function testCheckout(cartId) {
  // Add shipping
  await fetch('https://backend-production-7441.up.railway.app/store/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_shipping_address',
      cart_id: cartId,
      first_name: 'Test',
      last_name: 'User',
      address_1: '123 Test St',
      city: 'Test City',
      state: 'NY',
      postal_code: '10001',
      email: 'test@example.com'
    })
  });

  // Initialize payment
  const paymentResponse = await fetch('https://backend-production-7441.up.railway.app/store/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'initialize_payment',
      cart_id: cartId
    })
  });
  
  const { client_secret } = await paymentResponse.json();
  console.log('Payment initialized, client_secret:', client_secret);
  // Use client_secret with Stripe Elements
}
```

## Important Notes

1. **Prices are in DOLLARS**: Medusa products store prices in dollars, not cents
2. **Dual Cart System**: Keep Medusa and Core product carts separate
3. **Authentication**: These are public endpoints, no auth required
4. **Payment Provider**: Uses `pp_stripe_stripe` for Stripe integration
5. **Error Handling**: Always check `success` field in responses

## Deployment Checklist

- [ ] Environment variables set (Stripe keys)
- [ ] Cart persistence in localStorage
- [ ] Error handling for failed requests
- [ ] Loading states during checkout
- [ ] Success/confirmation pages
- [ ] Email notifications configured
- [ ] Mobile responsive checkout
- [ ] Test with real Stripe test cards

## Support

For issues or questions:
- Check endpoint status: `GET https://backend-production-7441.up.railway.app/health`
- Pricing status: `GET https://backend-production-7441.up.railway.app/pricing-status`
- Backend logs: Available in Railway dashboard