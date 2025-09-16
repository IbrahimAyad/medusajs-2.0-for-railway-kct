# KCT Menswear Payment System Fix Implementation Guide
**Date: September 16, 2025**
**Context Handoff Document**

## 🚨 CRITICAL ISSUE SUMMARY
Orders are NOT appearing in Medusa admin because the frontend sends incomplete data to the order-first endpoint, causing it to fail and fall back to bypass mode without proper order creation.

## 🔴 ROOT CAUSE
**Data Mismatch:** Frontend sends `customer_email` but backend expects `email`. Frontend also missing `items` array and `amount` field.

## ✅ EXACT FIXES REQUIRED

### 1. FRONTEND FIX - checkout-handler.ts
**File:** `/Users/ibrahim/Desktop/kct-menswear-medusa-test/src/lib/medusa/checkout-handler.ts`

#### Line 115 - createOrderFirstPayment method
**CURRENT CODE (BROKEN):**
```typescript
// Lines 140-145
body: JSON.stringify({
  cart_id: cartId,
  customer_email: email,  // ❌ WRONG FIELD NAME
  shipping_address: shippingAddress,
  billing_address: billingAddress
})
```

**REPLACE WITH:**
```typescript
// Get cart data first
const cart = cartAdapter.getCart()
if (!cart || !cart.items || cart.items.length === 0) {
  throw new Error('Cart is empty or invalid')
}

// Extract cart items
const items = cart.items.map(item => ({
  title: item.product?.title || item.title || 'Product',
  variant_id: item.variant_id,
  product_id: item.product?.id,
  quantity: item.quantity,
  unit_price: item.unit_price || item.product?.price || 0,
  metadata: {
    variant: item.variant,
    product_handle: item.product?.handle
  }
}))

body: JSON.stringify({
  cart_id: cartId,
  email: email,  // ✅ CORRECT FIELD NAME
  shipping_address: shippingAddress,
  billing_address: billingAddress,
  items: items,  // ✅ ADD ITEMS
  amount: cart.total || 0,  // ✅ ADD AMOUNT
  currency_code: 'usd'  // ✅ ADD CURRENCY
})
```

### 2. FRONTEND FIX - createDirectStripePayment method
**Same file, Line 190**

**ADD SAME FIX:**
```typescript
// Get cart data
const cart = cartAdapter.getCart()
const items = cart?.items?.map(item => ({
  title: item.product?.title || item.title || 'Product',
  variant_id: item.variant_id,
  product_id: item.product?.id,
  quantity: item.quantity,
  unit_price: item.unit_price || item.product?.price || 0
})) || []

body: JSON.stringify({
  cart_id: cartId,
  email: email,  // ✅ FIX FIELD NAME
  shipping_address: shippingAddress,
  billing_address: billingAddress,
  items: items,
  amount: cart?.total || 0,
  currency_code: 'usd'
})
```

### 3. BACKEND FIX (Optional but recommended)
**File:** `/Users/ibrahim/Desktop/medusa-railway-setup/backend/src/api/store/checkout/create-order/route.ts`

**Line 77 - Add fallback for customer_email:**
```typescript
const email = req.body.email || req.body.customer_email  // Support both field names
```

## 📂 FILES TO MODIFY
1. `/Users/ibrahim/Desktop/kct-menswear-medusa-test/src/lib/medusa/checkout-handler.ts`
2. `/Users/ibrahim/Desktop/medusa-railway-setup/backend/src/api/store/checkout/create-order/route.ts` (optional)

## 🚀 DEPLOYMENT COMMANDS

### Deploy Frontend to Vercel:
```bash
cd /Users/ibrahim/Desktop/kct-menswear-medusa-test
git add -A
git commit -m "Fix: Add cart items and correct field names for order-first payment"
git push origin main
# Vercel auto-deploys from GitHub
```

### Deploy Backend to Railway (if GitHub push blocked):
```bash
cd /Users/ibrahim/Desktop/medusa-railway-setup
railway up --service backend
# Wait for deployment to complete
railway logs
```

## ✅ VERIFICATION CHECKLIST
1. [ ] Make a test purchase on https://kct-menswear-medusa-test.vercel.app
2. [ ] Check Stripe dashboard - metadata should show `order_id` not just `cart_id`
3. [ ] Check Medusa admin - order should appear immediately
4. [ ] Verify tax is included in Stripe charge (should be $1.06 not $1.00)
5. [ ] Check if payment methods return (Amazon Pay, Klarna, etc.)

## 📊 CURRENT STATE
- **Backend:** Deployed on Railway, all endpoints working
- **Frontend:** Deployed on Vercel but sending wrong data
- **Issue:** Frontend data mismatch causing bypass flow
- **Tax:** Calculated correctly but not reaching Stripe

## ⚠️ KNOWN ISSUES & SOLUTIONS
1. **GitHub Push Blocked:** Use `railway up` CLI instead
2. **Railway Storefront:** Ignore build errors, not critical
3. **Webhook Pending:** Will resolve once orders create properly

## 🎯 SUCCESS CRITERIA
- Orders appear in Medusa admin
- Tax charged correctly ($1.06 for $1.00 item)
- Stripe metadata contains `order_id`
- No more "bypass_reason" in metadata