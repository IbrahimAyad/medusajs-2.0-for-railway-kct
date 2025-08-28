# Stripe Setup Guide for KCT Menswear

## Step 1: Create Stripe Account
1. Go to https://stripe.com
2. Click "Start now" 
3. Create account with KCT business email
4. Select "United States" as country

## Step 2: Complete Business Profile
1. **Business Type**: LLC or Corporation
2. **Industry**: Retail - Clothing and Accessories
3. **Business Description**: "Men's formal wear and suits retailer"
4. **Website**: Your domain (e.g., kctmenswear.com)
5. **Expected Volume**: Start with your estimate

## Step 3: Get Your API Keys

### Test Mode Keys (for development):
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy these keys:
   - **Publishable key**: `pk_test_...` (safe to expose)
   - **Secret key**: `sk_test_...` (keep private!)

### Live Mode Keys (for production):
1. Complete Stripe account verification first
2. Go to https://dashboard.stripe.com/apikeys
3. Copy these keys:
   - **Publishable key**: `pk_live_...`
   - **Secret key**: `sk_live_...`

## Step 4: Set Up Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: 
   ```
   https://your-railway-domain.up.railway.app/hooks/payment/stripe
   ```
4. **Events to listen for**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.processing`
   - `payment_intent.requires_action`

5. After creating, copy the **Webhook signing secret**: `whsec_...`

## Step 5: Add to Railway Environment Variables

Add these to your Railway project:

```bash
# For Testing (use these first)
STRIPE_API_KEY=sk_test_YOUR_TEST_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# For Production (after testing)
STRIPE_API_KEY=sk_live_YOUR_LIVE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

## Step 6: Configure Stripe Settings

### Payment Methods to Enable:
1. **Cards**: ✅ (Essential)
   - Visa, Mastercard, Amex, Discover
2. **Digital Wallets**: ✅
   - Apple Pay
   - Google Pay
3. **Buy Now, Pay Later**: (Optional)
   - Klarna
   - Afterpay (good for suits)
4. **Bank Debits**: (Optional)
   - ACH Direct Debit

### Recommended Settings:

#### Fraud Prevention:
- Enable Radar (Stripe's fraud detection)
- Set 3D Secure to "Recommended"
- Block high-risk countries if needed

#### Statement Descriptor:
- Set to: "KCT MENSWEAR" or "KCT SUITS"
- Customer will see this on their bank statement

#### Receipt Emails:
- Enable automatic receipts
- Customize email template with KCT branding

## Step 7: Test the Integration

### Test Card Numbers:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184

Use any future date for expiry
Use any 3 digits for CVC
Use any 5 digits for ZIP
```

### Test Flow:
1. Create a test product in Medusa admin
2. Add to cart on storefront
3. Checkout with test card
4. Verify payment in Stripe dashboard
5. Check order status in Medusa admin

## Step 8: Medusa Configuration Check

Your `medusa-config.js` should have:

```javascript
...(STRIPE_API_KEY && STRIPE_WEBHOOK_SECRET ? [{
  key: Modules.PAYMENT,
  resolve: '@medusajs/payment',
  options: {
    providers: [
      {
        resolve: '@medusajs/payment-stripe',
        id: 'stripe',
        options: {
          apiKey: STRIPE_API_KEY,
          webhookSecret: STRIPE_WEBHOOK_SECRET,
        },
      },
    ],
  },
}] : [])
```

## Step 9: Go Live Checklist

Before switching to live mode:
- [ ] Test all payment flows
- [ ] Verify webhook is receiving events
- [ ] Set up tax rates (if applicable)
- [ ] Configure shipping rates
- [ ] Test refund process
- [ ] Enable Stripe Radar rules
- [ ] Set up payout schedule (daily/weekly)
- [ ] Add bank account for payouts

## Common Issues & Solutions:

### Webhook Not Working:
- Ensure URL is correct and HTTPS
- Check Railway logs for webhook errors
- Verify webhook secret is correct

### Payment Declining:
- Check Stripe Radar settings
- Verify card details
- Check for sufficient funds

### Currency Issues:
- Default should be USD
- Enable multi-currency if needed

## Support Resources:
- Stripe Support: support@stripe.com
- Stripe Docs: https://stripe.com/docs
- Medusa Stripe Docs: https://docs.medusajs.com/plugins/payment/stripe

## Important Notes:
1. Start with TEST mode until everything works
2. PCI Compliance is handled by Stripe
3. Stripe takes 2.9% + 30¢ per transaction
4. Payouts typically take 2 business days
5. Keep your secret keys secure - never commit to Git!