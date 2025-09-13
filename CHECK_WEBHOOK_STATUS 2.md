# Troubleshooting: Order Not Appearing in Admin

## Current Status
✅ Payment processed successfully ($1.06)
✅ Customer sees order confirmation (order_1757703533830_MJFSC7)
❌ Order not appearing in Medusa admin

## Possible Issues to Check

### 1. Stripe Webhook Configuration
Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks

Check your webhook endpoint:
- **URL**: Should be `https://backend-production-7441.up.railway.app/hooks/payment/stripe`
- **Events**: Must include `payment_intent.succeeded`
- **Status**: Should show green/active

### 2. Check Webhook Attempts
In Stripe Dashboard → Webhooks → Click on your endpoint → "Webhook attempts"
- Look for recent `payment_intent.succeeded` events
- Check if they show success (200) or failure (4xx/5xx)
- Click on failed attempts to see error details

### 3. Verify Cart ID in Metadata
The payment intent needs cart metadata. Check in Stripe Dashboard:
1. Go to Payments
2. Find the $1.06 payment
3. Click on it → View details
4. Check "Metadata" section - should have:
   - `cartId`: (some ID)
   - `email`: customer email

### 4. Manual Order Creation (Temporary Workaround)
If webhook isn't working, the order data exists in Stripe but not Medusa. 
The cart was likely cleared after payment but before order creation.

## Quick Diagnostics

### Test Webhook Manually
```bash
# Check if webhook endpoint is accessible
curl https://backend-production-7441.up.railway.app/hooks/payment/stripe

# Should return: {"error":"No signature"}
```

### Check Railway Logs
```bash
railway logs --service Backend | grep "Stripe Webhook"
```

### Check Environment Variables in Railway
Verify these are set in Backend service → Variables:
- `STRIPE_WEBHOOK_SECRET`: whsec_KXNiDw7avzdZqbu9b3CyKjI09Awb6gmW
- `STRIPE_API_KEY`: Your secret key (sk_live_...)

## Most Likely Issue
The webhook might not be receiving events from Stripe. This could be because:
1. The webhook URL in Stripe doesn't match the deployed backend URL
2. The webhook secret doesn't match
3. The cart is being cleared before the webhook can process it

## Next Steps
1. Check Stripe Dashboard webhook attempts
2. Verify webhook URL matches exactly
3. Check if events are being sent and received
4. Look for any error messages in webhook attempts