# Stripe Webhook Setup Guide for KCT Menswear Medusa Backend

## Overview

This guide will help you configure Stripe webhooks to synchronize payment status with your Medusa e-commerce backend deployed on Railway. The webhook endpoint is specifically designed for payment status synchronization only and does not interfere with the existing order creation flow.

## Webhook Endpoint Information

- **URL**: `https://backend-production-7441.up.railway.app/webhooks/stripe`
- **Purpose**: Payment status synchronization only (does NOT create orders)
- **Handler Location**: `/src/api/webhooks/stripe/route.ts`
- **Features**: 
  - Idempotency protection
  - Secure signature verification
  - Payment status tracking
  - Error handling with retry prevention

## Step-by-Step Setup

### 1. Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Log in to your KCT Menswear Stripe account
3. Navigate to **Developers** → **Webhooks**

### 2. Create New Webhook Endpoint

1. Click **"Add endpoint"**
2. Enter the endpoint URL: `https://backend-production-7441.up.railway.app/webhooks/stripe`
3. Select **"Latest API version"** (currently 2025-08-27.basil)

### 3. Configure Events to Listen For

Select the following events that are essential for payment status synchronization:

#### Required Events:
- `payment_intent.succeeded` - When a payment is successfully captured
- `payment_intent.payment_failed` - When a payment attempt fails
- `payment_intent.canceled` - When a payment intent is canceled

#### Optional Events (for additional confirmation):
- `charge.succeeded` - Additional confirmation of successful payment
- `checkout.session.completed` - If using Stripe Checkout sessions

#### Events Configuration Screenshot:
```
☑️ payment_intent.succeeded
☑️ payment_intent.payment_failed  
☑️ payment_intent.canceled
☑️ charge.succeeded
☐ checkout.session.completed (optional)
```

### 4. Add Webhook Description

Add a description for clarity:
```
KCT Menswear Payment Status Sync - Updates order payment status in Medusa backend. Does not create orders.
```

### 5. Save and Get Webhook Secret

1. Click **"Add endpoint"**
2. After creation, click on the newly created webhook endpoint
3. In the **"Signing secret"** section, click **"Reveal"**
4. Copy the webhook signing secret (starts with `whsec_`)

### 6. Configure Railway Environment Variables

Add the following environment variables to your Railway deployment:

#### Required Environment Variables:

```bash
# Stripe Webhook Configuration
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret_here

# Stripe API Key (should already be configured)
STRIPE_API_KEY=sk_live_your_stripe_secret_key_here

# Optional: Enable additional webhook event verification
VERIFY_WEBHOOK_EVENTS=true
```

#### How to Add Environment Variables in Railway:

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your KCT Menswear backend project
3. Click on **"Variables"** tab
4. Add each environment variable:
   - Variable: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_your_actual_signing_secret`
5. Click **"Add"** for each variable
6. Railway will automatically redeploy with the new variables

### 7. Test the Webhook

#### Using Stripe CLI (Recommended):

1. Install Stripe CLI: `npm install -g stripe`
2. Login: `stripe login`
3. Test the webhook:
```bash
stripe trigger payment_intent.succeeded --override payment_intent:metadata[order_id]=test_order_123
```

#### Using Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select `payment_intent.succeeded`
5. Modify the test data to include order metadata:
```json
{
  "data": {
    "object": {
      "id": "pi_test_123",
      "metadata": {
        "order_id": "order_test_123"
      },
      "amount": 1000,
      "status": "succeeded"
    }
  }
}
```
6. Click **"Send test webhook"**

### 8. Monitor Webhook Activity

#### In Stripe Dashboard:
1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Check the **"Attempts"** tab for delivery status
4. Look for 200 response codes (successful processing)

#### In Railway Logs:
1. Go to Railway Dashboard → Your Project
2. Click **"Deployments"** tab
3. Check logs for entries starting with `[Payment Sync Webhook]`

## Expected Webhook Responses

### Successful Processing:
```json
{
  "received": true,
  "message": "Payment status updated",
  "order_id": "order_01234567890",
  "payment_status": "captured"
}
```

### Already Processed (Idempotency):
```json
{
  "received": true,
  "message": "Event already processed",
  "order_id": "order_01234567890"
}
```

### Order Not Found:
```json
{
  "received": true,
  "warning": "Payment succeeded but no associated order found",
  "payment_intent_id": "pi_123456789"
}
```

## Troubleshooting

### Common Issues:

#### 1. Webhook Signature Verification Failed
- **Cause**: Incorrect webhook secret or raw body parsing issues
- **Solution**: Verify `STRIPE_WEBHOOK_SECRET` is correctly set in Railway
- **Check**: Ensure the webhook secret starts with `whsec_`

#### 2. Order Not Found
- **Cause**: Payment intent metadata missing `order_id`
- **Solution**: Ensure your checkout flow includes order ID in payment intent metadata
- **Verify**: Check that order creation happens before payment processing

#### 3. Webhook Returns 400 Error
- **Cause**: Invalid webhook signature or malformed event
- **Solution**: Check Railway logs for specific error details
- **Verify**: Ensure webhook URL is exactly `https://backend-production-7441.up.railway.app/webhooks/stripe`

#### 4. Payment Status Not Updating
- **Cause**: Order metadata not being updated
- **Solution**: Check that the payment-capture utility is working correctly
- **Verify**: Look for `[Payment Capture]` entries in Railway logs

### Debug Mode:

To enable verbose logging, add this environment variable in Railway:
```bash
DEBUG_WEBHOOKS=true
```

### Testing Payment Flow:

1. Create a test order through your frontend
2. Process payment with Stripe test card: `4242 4242 4242 4242`
3. Check Railway logs for webhook processing
4. Verify order payment status in Medusa admin

## Security Considerations

1. **Always verify webhook signatures** - The handler already does this
2. **Use HTTPS only** - Railway provides HTTPS by default
3. **Monitor webhook attempts** - Set up alerts for failed webhooks
4. **Rotate webhook secrets periodically** - Update in both Stripe and Railway

## Production vs Development

### Development Setup:
- Use Stripe test keys and test webhook endpoints
- Can use ngrok for local testing: `ngrok http 3000`
- Webhook URL: `https://your-ngrok-url.ngrok.io/webhooks/stripe`

### Production Setup:
- Use Stripe live keys and live webhook endpoints
- Webhook URL: `https://backend-production-7441.up.railway.app/webhooks/stripe`
- Monitor webhook reliability closely

## Support

If you encounter issues:

1. Check Railway deployment logs
2. Verify Stripe webhook delivery attempts
3. Ensure all environment variables are set correctly
4. Test with Stripe CLI for debugging

## Summary

This webhook configuration ensures that payment status is properly synchronized between Stripe and your Medusa backend without interfering with the existing order creation flow. The idempotency protection prevents duplicate processing, and the secure signature verification ensures webhook authenticity.

Key Points:
- ✅ Updates payment status only (no order creation)
- ✅ Includes idempotency protection
- ✅ Secure signature verification
- ✅ Comprehensive error handling
- ✅ Railway deployment ready
- ✅ Compatible with existing checkout flow