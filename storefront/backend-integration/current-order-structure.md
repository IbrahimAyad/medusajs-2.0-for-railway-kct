# Current Order Data Structure from KCT Frontend

## Cart Item Structure
When items are added to cart, they have this structure:

```typescript
interface CartItem {
  id: string;                    // e.g., "suit-navy-2p"
  name: string;                  // e.g., "Navy Suit (2-Piece)"
  price: number;                 // e.g., 179.99
  originalPrice?: number;        // For discounted items
  quantity: number;              // e.g., 1
  image: string;                 // Full URL to product image
  size?: string;                 // e.g., "40R" for suits, "M" for shirts
  color?: string;                // e.g., "Navy"
  category?: string;             // e.g., "suit", "shirt", "tie", "tie-bundle"
  stripeProductId?: string;      // e.g., "prod_SlQuqaI2IR6FRm"
  stripePriceId?: string;        // e.g., "price_1Rpv2tCHc12x7sCzVvLRto3m"
  bundleItems?: BundleItem[];    // For tie bundles
  metadata?: {
    type?: string;               // e.g., "2-piece", "3-piece"
    fit?: string;                // e.g., "slim", "classic"
    style?: string;              // e.g., "bowtie", "skinny"
  }
}
```

## Checkout Process

### 1. Cart Summary
```javascript
{
  items: [
    {
      id: "suit-navy-3p",
      name: "Navy Suit (3-Piece)",
      price: 169.99,  // Discounted from 199.99
      originalPrice: 199.99,
      quantity: 1,
      size: "40R",
      color: "Navy",
      category: "suit",
      image: "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/navy/navy-main-2.jpg",
      stripeProductId: "prod_SlQuqaI2IR6FRm",
      stripePriceId: "price_1Rpv31CHc12x7sCzlFtlUflr"
    },
    {
      id: "shirt-white-slim",
      name: "White Dress Shirt (Slim)",
      price: 33.99,  // Discounted from 39.99
      originalPrice: 39.99,
      quantity: 1,
      size: "M",
      color: "White",
      category: "shirt",
      image: "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Dress%20Shirts/White-Dress-Shirt.jpg",
      stripeProductId: "prod_SlSRMPGpXou00R",
      stripePriceId: "price_1RpvWnCHc12x7sCzzioA64qD"
    },
    {
      id: "tie-burgundy-classic",
      name: "Burgundy Classic Tie",
      price: 21.24,  // Discounted from 24.99
      originalPrice: 24.99,
      quantity: 1,
      color: "Burgundy",
      category: "tie",
      image: "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Bow%3ATie/burgundy-mian.webp",
      stripeProductId: "prod_SlSCPLZUyO8MFe",
      stripePriceId: "price_1RpvI9CHc12x7sCzE8Q9emhw"
    }
  ],
  subtotal: 264.97,
  discount: 40.00,  // 15% bundle discount
  total: 224.97,
  itemCount: 3,
  isBundle: true,
  bundleType: "professional"
}
```

### 2. Tie Bundle Order Example
```javascript
{
  items: [
    {
      id: "tie-bundle-8-tie-1706789123456",
      name: "8-Tie Bundle - Buy 8 Get 3 Free",
      price: 149.95,
      quantity: 1,
      category: "tie-bundle",
      image: "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Bow%3ATie/8-tie-bundle.jpg",
      stripeProductId: "prod_SlSJVpvJgGyQEg",
      stripePriceId: "price_1RpvM9CHc12x7sCzqkW3QKUV",
      bundleItems: [
        {
          color: "Navy",
          style: "classic",
          quantity: 1,
          displayName: "Navy"
        },
        {
          color: "Burgundy",
          style: "classic",
          quantity: 1,
          displayName: "Burgundy"
        },
        {
          color: "Silver",
          style: "classic",
          quantity: 1,
          displayName: "Silver"
        },
        {
          color: "Black",
          style: "skinny",
          quantity: 1,
          displayName: "Black"
        },
        {
          color: "Royal Blue",
          style: "slim",
          quantity: 1,
          displayName: "Royal Blue"
        },
        {
          color: "Forest Green",
          style: "classic",
          quantity: 1,
          displayName: "Forest Green"
        },
        {
          color: "Gold",
          style: "bowtie",
          quantity: 1,
          displayName: "Gold"
        },
        {
          color: "Charcoal",
          style: "classic",
          quantity: 1,
          displayName: "Charcoal"
        }
      ]
    }
  ],
  subtotal: 149.95,
  discount: 0,
  total: 149.95,
  itemCount: 1
}
```

### 3. Stripe Checkout Session
When creating checkout session, we send:

```javascript
{
  line_items: [
    {
      price: "price_1Rpv31CHc12x7sCzlFtlUflr",  // Navy 3-piece suit
      quantity: 1,
      adjustable_quantity: {
        enabled: false
      }
    },
    {
      price: "price_1RpvWnCHc12x7sCzzioA64qD",  // White slim shirt
      quantity: 1
    },
    {
      price: "price_1RpvI9CHc12x7sCzE8Q9emhw",  // Burgundy classic tie
      quantity: 1
    }
  ],
  mode: 'payment',
  success_url: 'https://kctmenswear.com/checkout/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://kctmenswear.com/cart',
  shipping_address_collection: {
    allowed_countries: ['US', 'CA']
  },
  metadata: {
    order_type: 'bundle',
    bundle_type: 'professional',
    bundle_discount: '40.00',
    items: JSON.stringify(cartItems)  // Full cart data for reference
  }
}
```

### 4. After Successful Payment
Stripe webhook sends:

```javascript
{
  id: "evt_1234567890",
  object: "event",
  api_version: "2023-10-16",
  created: 1706789123,
  data: {
    object: {
      id: "cs_test_1234567890",
      object: "checkout.session",
      amount_total: 22497,  // $224.97 in cents
      currency: "usd",
      customer_details: {
        address: {
          city: "Detroit",
          country: "US",
          line1: "123 Main Street",
          line2: null,
          postal_code: "48201",
          state: "MI"
        },
        email: "customer@example.com",
        name: "John Doe",
        phone: "+13135551234"
      },
      line_items: {
        // Product details
      },
      metadata: {
        order_type: "bundle",
        bundle_type: "professional",
        bundle_discount: "40.00",
        items: "[{...}]"  // JSON string of cart items
      },
      payment_intent: "pi_1234567890",
      payment_status: "paid",
      shipping_details: {
        address: {
          // Same as customer_details.address
        },
        name: "John Doe"
      },
      status: "complete"
    }
  },
  type: "checkout.session.completed"
}
```

## Key Points for Backend Integration

1. **Bundle Detection**: Check `category` field or `metadata.order_type`
2. **Tie Bundle Items**: Parse `bundleItems` array for individual selections
3. **Size/Variant Info**: Available in item's `size`, `metadata.fit`, `metadata.style`
4. **Pricing**: Bundle discounts are already applied to individual item prices
5. **Stripe IDs**: Both product and price IDs are included for reference

## Required Webhook Handler

```javascript
// Your backend should handle this structure
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract order data
      const order = {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        total: session.amount_total / 100,
        customer: {
          email: session.customer_details.email,
          name: session.customer_details.name,
          phone: session.customer_details.phone,
          address: session.customer_details.address
        },
        items: JSON.parse(session.metadata.items || '[]'),
        bundle_info: {
          is_bundle: session.metadata.order_type === 'bundle',
          bundle_type: session.metadata.bundle_type,
          discount: parseFloat(session.metadata.bundle_discount || '0')
        }
      };
      
      // Create order in your database
      await createOrder(order);
      
      // Send confirmation email
      await sendOrderConfirmation(order);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

This is the exact data structure currently being used in the KCT Menswear frontend!