# Fix Backend Webhook Invalid Signature Error

## The Issue
Your backend webhook at `https://kct-ecommerce-admin-backend-production.up.railway.app/api/webhooks/stripe` is returning 400 errors with "Invalid signature".

## Root Cause
Each webhook endpoint in Stripe has its own unique signing secret. Your backend is likely using the wrong webhook secret.

## Solution

### 1. Get the correct webhook secret for your backend
1. Go to Stripe Dashboard > Developers > Webhooks
2. Click on your backend webhook endpoint: `https://kct-ecommerce-admin-backend-production.up.railway.app/api/webhooks/stripe`
3. Click on "Reveal" under "Signing secret"
4. Copy the secret (it should start with `whsec_`)

### 2. Update the webhook secret in Railway
1. Go to your Railway dashboard
2. Navigate to your backend project
3. Go to Variables/Environment Variables
4. Find `STRIPE_WEBHOOK_SECRET` 
5. Update it with the correct secret from step 1
6. Deploy the changes

### 3. Verify both webhooks are configured correctly

You have two separate webhooks:
- **Frontend (Vercel)**: `https://qvcswiimsaxvyfqxbklbz.supabase.co` - This is working ✅
- **Backend (Railway)**: `https://kct-ecommerce-admin-backend-production.up.railway.app/api/webhooks/stripe` - This needs the fix ❌

Each needs its own unique webhook secret from Stripe.

### 4. Test the webhook
After updating the secret:
1. In Stripe Dashboard, go to your backend webhook
2. Click "Send test webhook"
3. Select any event type
4. It should now return 200 OK

## Important Notes
- Never use the same webhook secret for different endpoints
- Each webhook endpoint in Stripe generates a unique signing secret
- The frontend webhook secret (in Vercel) is different from the backend webhook secret (in Railway)