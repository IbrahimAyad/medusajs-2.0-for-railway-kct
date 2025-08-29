# Stripe Payment Setup - Medusa Backend

## Current Status
✅ Stripe plugin is already configured in medusa-config.js
⏳ Need to add Stripe credentials to Railway

## Required Environment Variables

Add these to Railway dashboard:

```bash
STRIPE_API_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## How to Get Your Stripe Credentials

### 1. Stripe API Key
1. Login to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → API keys
3. Copy your Secret key (starts with `sk_`)
   - Use `sk_test_` for testing
   - Use `sk_live_` for production

### 2. Webhook Secret
1. In Stripe Dashboard, go to Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://backend-production-7441.up.railway.app/stripe/hooks`
4. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.amount_capturable_updated`
5. Click "Add endpoint"
6. Copy the Signing secret (starts with `whsec_`)

## Adding to Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project: **admin-kct**
3. Click on the **backend** service
4. Go to **Variables** tab
5. Add:
   ```
   STRIPE_API_KEY=[your_secret_key]
   STRIPE_WEBHOOK_SECRET=[your_webhook_secret]
   ```
6. Click "Deploy" to apply changes

## Testing Stripe Integration

After adding credentials and redeploying:

1. **In Admin Panel**:
   - Go to Settings → Payment Providers
   - Stripe should appear as "Enabled"
   
2. **Test Payment**:
   - Create a test order
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date for expiry
   - Any 3 digits for CVC

## Integration with Existing Frontend

Since you already have Stripe on your Vercel/Supabase frontend:

### Option 1: Dual Integration (Recommended)
- Keep existing frontend Stripe for customer portal
- Use Medusa Stripe for admin order processing
- Both use same Stripe account, different purposes

### Option 2: Unified Checkout
- Replace frontend checkout with Medusa checkout API
- Frontend calls Medusa payment endpoints
- Single source of truth for orders

### Option 3: Hybrid Approach
- Frontend handles payment collection
- Sends payment intent to Medusa for order creation
- Medusa manages fulfillment and inventory

## Stripe Features in Medusa

Once configured, you get:
- ✅ Payment processing in admin
- ✅ Refunds and captures
- ✅ Automatic webhook handling
- ✅ Payment method management
- ✅ Multi-currency support
- ✅ Payment links generation

## Common Issues

### Webhook Not Working
- Verify endpoint URL is exactly: `https://backend-production-7441.up.railway.app/stripe/hooks`
- Check Railway logs for webhook errors
- Ensure webhook secret matches

### Payment Failing
- Check API key is correct (test vs live)
- Verify currency settings in admin
- Check Railway logs for Stripe errors

### Orders Not Creating
- Ensure inventory is available
- Check shipping zones are configured
- Verify tax settings if applicable