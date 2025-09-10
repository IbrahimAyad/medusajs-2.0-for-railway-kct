# KCT Menswear Core Products Documentation

## Table of Contents
1. [Overview](#overview)
2. [Product Categories](#product-categories)
3. [Stripe Integration](#stripe-integration)
4. [Technical Implementation](#technical-implementation)
5. [Cart & Checkout Flow](#cart--checkout-flow)
6. [API Reference](#api-reference)
7. [Troubleshooting](#troubleshooting)

## Overview

KCT Menswear's e-commerce platform features three core product categories: Suits, Dress Shirts, and Ties & Bowties. Each category has been fully integrated with Stripe for payment processing and includes sophisticated features like bundle pricing, size variations, and inventory management.

### Key Features
- **Multi-variant Products**: Different sizes, colors, and styles
- **Bundle Pricing**: Automatic discounts for bulk purchases
- **Smart Cart System**: Preserves all product metadata through checkout
- **Stripe Integration**: Full payment processing with automatic tax calculation
- **Responsive Design**: Mobile-first approach with desktop optimization

## Product Categories

### 1. Suits

#### Product Structure
- **Colors Available**: 16 colors (Black, Navy, Charcoal, Light Grey, Dark Grey, Burgundy, Hunter Green, Royal Blue, Tan, Brown, Olive, Steel Blue, Slate, Midnight Blue, Ivory, White)
- **Types**: 2-Piece and 3-Piece options
- **Sizes**: 34-52 with S/R/L lengths

#### Stripe Product Mapping
```javascript
suits: {
  black: { 
    productId: 'prod_SlRxbBl5ZnnoDy', 
    twoPiece: 'price_1RqeTbCHc12x7sCzWJsI2iDF', 
    threePiece: 'price_1Rf2leCHc12x7sCze2X4icnL' 
  },
  navy: { 
    productId: 'prod_SlRylcF7iGbzIG', 
    twoPiece: 'price_1Rpv31CHc12x7sCzlFtlUflr', 
    threePiece: 'price_1Rpv2tCHc12x7sCzVvLRto3m' 
  },
  charcoal: { 
    productId: 'prod_SlRzSVvtkVqlpz', 
    twoPiece: 'price_1Rpv3ZCHc12x7sCzr4qlBV5x', 
    threePiece: 'price_1Rpv3LCHc12x7sCzB0Icj0Pw' 
  },
  // ... (see /src/lib/services/stripeProductService.ts for complete list)
}
```

#### URL Structure
- Collection: `/products/suits`
- Individual Product: `/products/suits/[color]` (e.g., `/products/suits/navy`)

### 2. Dress Shirts

#### Product Structure
- **Colors Available**: 17 colors (Black, Brown, Burgundy, Burnt Orange, Fuchsia, Light Grey, Light Pink, Light Blue, Lilac, Navy, Peach, Purple, Red, Royal Blue, Sage, Tan, White)
- **Fits**: 
  - **Slim Cut**: S, M, L, XL, XXL (simplified sizing)
  - **Classic Fit**: Traditional neck (15"-22") + sleeve (32-33, 34-35, 36-37) combinations
- **Price**: $39.99 (all shirts)

#### Stripe Product Mapping
```javascript
// All dress shirts use one of these two price IDs based on fit
fits: {
  slim: {
    productId: 'prod_SlSRMPGpXou00R',
    priceId: 'price_1RpvWnCHc12x7sCzzioA64qD'
  },
  classic: {
    productId: 'prod_SlSRbnQ86MqArC',
    priceId: 'price_1RpvXACHc12x7sCz2Ngkmp64'
  }
}
```

#### Size Availability Rules
- Neck sizes 15"-18.5": All sleeve lengths available
- Neck sizes 19"-20": Only 34-35 and 36-37 sleeves
- Neck size 22": Only 34-35 and 36-37 sleeves

#### URL Structure
- Collection: `/collections/dress-shirts`
- Color Collection: `/collections/dress-shirts/[color]` (e.g., `/collections/dress-shirts/navy`)
- Individual Product: `/products/dress-shirts/[color]-[fit]` (e.g., `/products/dress-shirts/navy-slim`)

### 3. Ties & Bowties

#### Product Structure
- **Colors Available**: 30+ colors
- **Styles**: 
  - Pre-tied Bow Tie (Adjustable)
  - Classic Tie (3.25")
  - Skinny Tie (2.75")
  - Slim Tie (2.25")
- **Price**: $24.99 (all individual ties)

#### Stripe Product Mapping
```javascript
styles: {
  bowtie: {
    productId: 'prod_SlSC8NMRQDcAAe',
    priceId: 'price_1RpvIMCHc12x7sCzj6ZTx21q'
  },
  classic: {
    productId: 'prod_SlSCPLZUyO8MFe',
    priceId: 'price_1RpvI9CHc12x7sCzE8Q9emhw'
  },
  skinny: {
    productId: 'prod_SlSC1Sy11qUgt1',
    priceId: 'price_1RpvHyCHc12x7sCzjX1WV931'
  },
  slim: {
    productId: 'prod_SlSC9yAp6lLFm3',
    priceId: 'price_1RpvHlCHc12x7sCzp0TVNS92'
  }
}
```

#### Bundle Options
```javascript
bundles: {
  five: {
    productId: 'prod_SlSLsx1Aqf1kYL',
    priceId: 'price_1RpvQqCHc12x7sCzfRrWStZb',
    price: 99.97  // Buy 4 Get 1 Free
  },
  eight: {
    productId: 'prod_SlSLxWsdjVPsBS',
    priceId: 'price_1RpvRACHc12x7sCzVYFZh6Ia',
    price: 149.96  // Buy 6 Get 2 Free
  },
  eleven: {
    productId: 'prod_SlSMj6NTxWBXMO',
    priceId: 'price_1RpvRSCHc12x7sCzpo0fgH6A',
    price: 199.95  // Buy 8 Get 3 Free
  }
}
```

#### URL Structure
- Collection: `/collections/ties`
- Color Collection: `/collections/ties/[color]` (e.g., `/collections/ties/burgundy`)
- Individual Product: `/products/ties/[color]-[style]` (e.g., `/products/ties/burgundy-bowtie`)

## Stripe Integration

### Configuration
```javascript
// Environment Variables Required
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Checkout Session Creation
The checkout process creates a Stripe session with:
- Automatic tax calculation enabled
- Shipping address collection (US & Canada)
- Fixed shipping rate: `shr_1Rq49FCHc12x7sCzaNB3IohF`

### Webhook Events Handled
- `checkout.session.completed`
- `payment_intent.succeeded`
- `charge.succeeded`
- `charge.refunded`
- `payment_intent.payment_failed`
- `charge.failed`

## Technical Implementation

### Cart System Architecture

#### Cart Item Structure
```typescript
interface CartItemData {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stripePriceId: string;
  stripeProductId?: string;
  selectedColor?: string;
  selectedSize?: string;
  category?: string;
  bundleId?: string;
  metadata?: Record<string, any>;
}
```

#### Adding Items to Cart
```javascript
// Example: Adding a suit
addItem({
  id: 'suit-navy-2piece',
  name: 'Navy 2 Piece Suit',
  price: 599,
  image: 'https://...',
  quantity: 1,
  stripePriceId: 'price_1Rpv31CHc12x7sCzlFtlUflr',
  stripeProductId: 'prod_SlRylcF7iGbzIG',
  selectedColor: 'Navy',
  selectedSize: '40R',
  category: 'suits',
  metadata: {
    suitType: 'twoPiece',
    suitColor: 'navy'
  }
});
```

### Component Structure

#### Key Components
1. **Product Selectors**
   - `SuitTypeSelector`: 2-piece vs 3-piece selection
   - `DressShirtFitSelector`: Slim vs Classic fit
   - `DressShirtSizeSelector`: Dynamic sizing based on fit
   - `TieStyleSelector`: Style selection for ties

2. **Cart Components**
   - `SimpleCartDrawer`: Shopping cart overlay
   - `CheckoutButton`: Handles Stripe checkout initiation
   - Smart price ID mapping for all product types

3. **Collection Pages**
   - Grid layouts with responsive design
   - Hover effects and quick actions
   - Size/style selection modals

## Cart & Checkout Flow

### 1. Product Selection Flow
```
User browses collection → Selects product → Chooses options (size/style) → Adds to cart
```

### 2. Cart Management
- Items stored in Zustand store with localStorage persistence
- Cart survives page refreshes
- Metadata preserved through entire flow

### 3. Checkout Process
```
Cart Review → Click Checkout → Stripe Session Created → Redirect to Stripe → Payment → Success Page
```

### 4. Order Confirmation
- Webhook captures successful payment
- Order details stored with full metadata
- Customer receives confirmation email (via Stripe)

## API Reference

### Checkout Endpoint
**POST** `/api/stripe/checkout`

```javascript
// Request Body
{
  items: [{
    stripePriceId: string,
    quantity: number,
    name: string,
    selectedSize?: string,
    selectedColor?: string,
    id: string,
    price: number
  }],
  customerEmail?: string
}

// Response
{
  sessionId: string,
  url: string
}
```

### Webhook Endpoint
**POST** `/api/webhooks/stripe`
- Validates Stripe signature
- Processes payment events
- Updates order status

## Troubleshooting

### Common Issues

#### 1. "Missing checkout data" Error
**Cause**: Cart item missing Stripe price ID
**Solution**: Ensure all products have `stripePriceId` when added to cart

#### 2. Checkout Fails with 500 Error
**Cause**: Invalid Stripe price ID
**Solution**: Verify price IDs match your Stripe dashboard

#### 3. Tax Not Calculating
**Cause**: Automatic tax not enabled in Stripe
**Solution**: Enable automatic tax in Stripe dashboard settings

#### 4. Webhook Failures
**Cause**: Invalid webhook secret or signature
**Solution**: Update `STRIPE_WEBHOOK_SECRET` in environment variables

### Debugging Tips

1. **Check Console Logs**
   ```javascript
   // Cart addition logs
   console.log('Adding to cart:', item);
   
   // Checkout logs
   console.log('Sending to checkout API:', checkoutItems);
   ```

2. **Verify Stripe IDs**
   - All price IDs should start with `price_`
   - All product IDs should start with `prod_`
   - Check Stripe dashboard for correct IDs

3. **Test Mode**
   - Use Stripe test keys for development
   - Test card: 4242 4242 4242 4242
   - Any future date and CVC

### Support Contacts
- Technical Issues: Check browser console for errors
- Stripe Issues: Verify API keys and webhook configuration
- Integration Help: Review this documentation and code comments

## Future Enhancements

### Planned Features
1. **Inventory Management**: Real-time stock tracking
2. **Customer Accounts**: Order history and saved addresses
3. **Reviews & Ratings**: Customer feedback system
4. **Wishlist**: Save items for later
5. **Advanced Search**: Filter by multiple attributes
6. **Size Recommendations**: AI-powered fitting assistant
7. **Email Notifications**: Order updates and shipping info
8. **Loyalty Program**: Points and rewards system

### API Expansions
- GET `/api/products`: Product listing with filters
- GET `/api/orders/:id`: Order details
- POST `/api/reviews`: Submit product reviews
- GET `/api/inventory/:productId`: Stock availability

---

Last Updated: January 2025
Version: 1.0.0