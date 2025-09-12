# Deploy Stripe Webhook Handler to Railway

## What We've Done

We've created a Stripe webhook handler at `/src/api/hooks/payment/stripe/route.ts` that will:
- Listen for `payment_intent.succeeded` events from Stripe
- Complete the cart workflow to create orders in Medusa
- Make orders appear in your Medusa admin dashboard

## Manual Deployment Steps

Since GitHub is blocking the push due to secrets in previous commits, you need to deploy manually:

### Option 1: Via Railway Dashboard (Recommended)

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Navigate to your "admin-kct" project
3. Select the backend service
4. Click on "Deployments" tab
5. Click "Trigger Deploy" or "Redeploy" button
6. Wait for deployment to complete (usually 2-3 minutes)

### Option 2: Via Railway CLI

Run these commands in the backend directory:
```bash
cd /Users/ibrahim/Desktop/medusa-railway-setup/backend
railway up --service <backend-service-name>
```

Replace `<backend-service-name>` with the actual service name from your Railway project.

### Option 3: Force Push (Not Recommended)

If you want to push despite the secrets warning:
1. Visit the URLs provided in the error message to allow the secrets
2. Then push again with: `git push myfork master`

## Configure Webhook Secret

After deployment, you need to set the `STRIPE_WEBHOOK_SECRET` environment variable in Railway:

1. Go to your Railway dashboard
2. Select the backend service
3. Go to "Variables" tab
4. Add: `STRIPE_WEBHOOK_SECRET` with the value from your Stripe webhook settings

To get the webhook secret:
1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint (ending with `/hooks/payment/stripe`)
3. Copy the "Signing secret" (starts with `whsec_`)
4. Add it to Railway variables

## Verify Deployment

After deployment:
1. Check Railway logs for "Deployment successful"
2. Test a payment on your frontend
3. Check Stripe Dashboard to see if webhook is receiving events
4. Check Medusa admin to see if orders appear

## Files Changed

- **New file**: `/src/api/hooks/payment/stripe/route.ts` - Webhook handler for Stripe events
- **Modified**: Git history with webhook handler commit

## Webhook Handler Features

The handler:
- ✅ Verifies Stripe webhook signatures for security
- ✅ Processes payment_intent.succeeded events
- ✅ Completes cart workflow to create orders
- ✅ Handles edge cases (missing cart, already completed)
- ✅ Provides detailed logging for debugging

## Next Steps

1. Deploy the backend with the webhook handler
2. Set the STRIPE_WEBHOOK_SECRET in Railway variables
3. Test a complete checkout flow
4. Verify orders appear in Medusa admin

## Troubleshooting

If orders still don't appear:
1. Check Railway logs: `railway logs --service <backend-service-name>`
2. Check Stripe webhook logs in Stripe Dashboard
3. Verify STRIPE_WEBHOOK_SECRET is set correctly
4. Ensure webhook URL is correct in Stripe

The webhook endpoint URL should be:
`https://backend-production-7441.up.railway.app/hooks/payment/stripe`