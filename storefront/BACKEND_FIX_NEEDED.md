# CRITICAL: Backend Fix Needed for Order Completion

## Issue Summary
Orders are failing to complete even though Stripe payments succeed. Customers are being charged but no order is created in Medusa.

## What's Happening
1. Payment succeeds in Stripe ($100.00 charged)
2. Backend `/store/complete-cart` endpoint fails
3. Backend tries to capture an already-captured payment (ERROR)
4. Backend tries to cancel a succeeded payment (ERROR)  
5. Backend automatically refunds the payment
6. Customer sees error but was temporarily charged

## Root Cause
The Stripe payment intent is using **automatic capture mode** but the backend expects **manual capture mode**.

When payment.confirm() is called from the frontend, Stripe automatically captures the payment. The backend then tries to capture it again, which fails.

## Evidence from Stripe Dashboard
```
Payment Intent: pi_3S5M2oCHc12x7sCz0v1kCHEH
Status: succeeded
Capture Method: automatic

Error from backend capture attempt:
"This PaymentIntent could not be captured because it has already been captured."

Error from backend cancel attempt:  
"You cannot cancel this PaymentIntent because it has a status of succeeded."
```

## Solution Options

### Option 1: Fix Backend to Handle Auto-Capture (RECOMMENDED)
Update `/store/complete-cart` endpoint to:
```javascript
// Pseudo-code for backend fix
async function completeCart(cartId) {
  const cart = await getCart(cartId);
  const paymentIntent = await stripe.paymentIntents.retrieve(cart.payment_intent_id);
  
  // Check if already captured
  if (paymentIntent.status === 'succeeded') {
    // Skip capture, payment is already done
    console.log('Payment already captured, proceeding with order creation');
  } else if (paymentIntent.status === 'requires_capture') {
    // Only capture if needed
    await stripe.paymentIntents.capture(paymentIntent.id);
  }
  
  // Create the order regardless
  const order = await createOrder(cart);
  return order;
}
```

### Option 2: Switch to Manual Capture Mode
Change payment session creation to use manual capture:
```javascript
// When creating payment intent
{
  amount: amount,
  currency: 'usd',
  capture_method: 'manual', // Instead of 'automatic'
  ...
}
```

Then the current backend flow would work correctly.

## Immediate Actions Needed

1. **Backend team should**:
   - Check payment intent status before attempting capture
   - Handle "already captured" scenario gracefully
   - Create order even if capture step is skipped

2. **Monitor refunds**: 
   - Multiple failed attempts are creating automatic refunds
   - Check Stripe dashboard for refunded payments

3. **Customer communication**:
   - Any customers who see this error have been refunded
   - Their payment was temporarily authorized but then refunded

## Test Case
Cart ID: cart_01K4PP73TTK74W1601XBGV2SZ8
Payment Intent: pi_3S5M2oCHc12x7sCz0v1kCHEH
Amount: $100.00
Status: Payment succeeded, order creation failed, automatic refund issued

## Frontend Status
The frontend is correctly:
- Showing error messages with cart ID and payment intent
- Not showing fake success when order fails
- Providing support contact information
- Handling retries for authorization

The issue is entirely in the backend's `/store/complete-cart` endpoint.