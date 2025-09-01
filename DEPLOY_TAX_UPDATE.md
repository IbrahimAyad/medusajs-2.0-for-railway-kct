# Deploy Stripe Tax Update to Railway

## What's Been Added
We've implemented automated tax calculation using Stripe Tax. This will automatically calculate sales tax for US orders and VAT for international orders.

## Files Changed
1. `backend/medusa-config.js` - Added Stripe Tax module configuration
2. `backend/src/modules/stripe-tax/index.ts` - Tax provider module export
3. `backend/src/modules/stripe-tax/services/stripe-tax.ts` - Stripe Tax implementation

## Manual Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Find your backend service
3. Go to Settings → Deploy
4. Trigger a manual redeploy

The new tax provider will be automatically included since the files are already in your local directory.

### Option 2: Deploy via Railway CLI

```bash
# From the backend directory
cd backend

# Deploy to your backend service
# You'll need to specify your service name - it might be one of:
railway up --service backend-production-7441
# or
railway up --service medusa-backend
# or check your Railway dashboard for the exact service name
```

### Option 3: Push Without Secrets (Clean Repository)

1. Remove the files with secrets:
```bash
# Remove files with exposed secrets
rm RAILWAY_ENV_VARIABLES.env
rm RAILWAY_ENV_CHECKLIST.md

# Commit the removal
git add -A
git commit -m "Remove files with secrets"

# Now push should work
git push myfork master
```

2. Railway will automatically deploy from GitHub

## After Deployment

### 1. Activate Stripe Tax in Stripe Dashboard

**IMPORTANT**: You must activate Stripe Tax in your Stripe account:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to: **Products → Tax**
3. Click **"Get Started"** or **"Activate Tax"**
4. Complete the onboarding process
5. Add tax registrations for states where you have nexus

### 2. Configure Tax Registrations

In Stripe Dashboard → Tax → Registrations:
- Add registrations for states where you collect tax
- Typically start with your home state
- Add other states as you reach economic nexus thresholds

### 3. Test Tax Calculation

Test with different addresses to verify tax calculation:

```bash
# Test API endpoint (after deployment)
curl -X POST https://backend-production-7441.up.railway.app/store/carts/[CART_ID]/taxes \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "address_1": "123 Main St",
      "city": "Los Angeles",
      "province": "CA",
      "postal_code": "90001",
      "country_code": "US"
    }
  }'
```

### 4. Monitor in Stripe Dashboard

- View calculations: Stripe Dashboard → Tax → Calculations
- Check tax collected: Stripe Dashboard → Tax → Reports
- Review settings: Stripe Dashboard → Tax → Settings

## Verification

After deployment, verify the tax module is loaded:

1. Check the deployment logs for:
```
Loading tax provider: stripe-tax
Tax module initialized with Stripe Tax provider
```

2. Test checkout with a US address - tax should be calculated automatically

3. Check Stripe Dashboard → Tax → Calculations to see the API calls

## Troubleshooting

### If Tax Isn't Calculating:

1. **Check Stripe Tax is activated**: Must be enabled in Stripe Dashboard
2. **Verify deployment**: Check Railway logs for any errors
3. **Test with registered state**: Tax only calculates for registered jurisdictions
4. **Check address format**: Ensure complete address with zip code

### If Deployment Fails:

1. Check for TypeScript errors:
```bash
cd backend
npm run build
```

2. Fix any compilation errors and redeploy

3. Check Railway build logs for specific errors

## Frontend Update Required

The frontend should already handle tax display, but verify it shows:
- Tax amount in cart
- Tax breakdown in checkout
- Updates tax when address changes

## Summary

✅ Stripe Tax provider implemented
✅ Automatic tax calculation configured
✅ Ready for deployment
⏳ Awaiting deployment to Railway
⏳ Stripe Tax activation required in Dashboard

Once deployed and Stripe Tax is activated, tax will be automatically calculated for all orders based on shipping address.