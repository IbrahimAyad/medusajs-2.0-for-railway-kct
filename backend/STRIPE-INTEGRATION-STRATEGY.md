# Stripe Integration Strategy for KCT Menswear

## Current Architecture
You have two systems that need to work together:

### 1. Existing Setup (Keep Active):
- **Frontend**: https://kct-menswear-ai-enhanced.vercel.app
- **Webhook**: https://gvcswimqaxvylgxbklbz.supabase.co/functions/v1/stripe-webhook
- **Webhook Secret**: whsec_KXNiDw7avzdZqbu9b3CyKjI09Awb6gmW
- **Destination ID**: we_1RxLPKCHc12x7sCzxD8CYc7I

### 2. New Medusa Admin (Being Added):
- **Backend**: Railway deployment
- **Admin Panel**: For inventory/order management
- **Purpose**: Centralized inventory and order processing

## Recommended Integration Approach

### Option 1: Unified Stripe Account (RECOMMENDED)
Use the SAME Stripe account for both systems:

```
┌─────────────────────────────────────────┐
│           STRIPE ACCOUNT                 │
│         (Single Source of Truth)         │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐    ┌──────────┐
│ Vercel   │    │  Medusa  │
│ Frontend │    │  Admin   │
└──────────┘    └──────────┘
    │                 │
    ▼                 ▼
┌──────────┐    ┌──────────┐
│ Supabase │    │ Railway  │
│    DB    │    │    DB    │
└──────────┘    └──────────┘
```

### Implementation Steps:

## Step 1: Configure Stripe for Both Systems

### For Medusa (New):
Add to Railway environment variables:
```bash
# Use your existing Stripe keys
STRIPE_API_KEY=sk_live_YOUR_EXISTING_KEY
STRIPE_WEBHOOK_SECRET=whsec_NEW_WEBHOOK_FOR_MEDUSA
```

### Create Second Webhook for Medusa:
1. Go to Stripe Dashboard → Webhooks
2. Add new endpoint: `https://your-railway-url.up.railway.app/hooks/payment/stripe`
3. Select same events as your Supabase webhook
4. Get new webhook secret for Medusa

## Step 2: Inventory Synchronization

### Architecture:
```
Customer Places Order → Stripe Payment
                        ↓
            ┌───────────────────────┐
            │   Webhook Triggers    │
            ├───────────────────────┤
            │ 1. Supabase Function  │
            │ 2. Medusa Backend     │
            └───────────────────────┘
                        ↓
            ┌───────────────────────┐
            │  Inventory Updates    │
            ├───────────────────────┤
            │ • Supabase DB         │
            │ • Medusa DB           │
            └───────────────────────┘
```

### Sync Strategy:
1. **Medusa as Master Inventory**: 
   - All inventory managed in Medusa admin
   - Sync to Supabase via API calls

2. **Real-time Sync via Webhooks**:
   - When order placed on Vercel site → Update Medusa inventory
   - When order placed in Medusa → Update Supabase inventory

## Step 3: Order Management Flow

### For Orders from Vercel/Supabase Frontend:
```javascript
// In your Supabase webhook function
export async function handleStripeWebhook(event) {
  // Process payment in Supabase
  await updateSupabaseOrder(event);
  
  // Sync to Medusa
  await fetch('https://your-medusa-api.railway.app/admin/orders', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_MEDUSA_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // Map Stripe data to Medusa order format
      customer_id: event.customer,
      items: mapStripeItemsToMedusa(event.line_items),
      payment_info: {
        stripe_payment_id: event.payment_intent,
        amount: event.amount_total
      }
    })
  });
}
```

### For Orders from Medusa Admin:
```javascript
// In medusa-config.js - Add custom webhook handler
{
  key: Modules.PAYMENT,
  resolve: '@medusajs/payment',
  options: {
    providers: [{
      resolve: '@medusajs/payment-stripe',
      id: 'stripe',
      options: {
        apiKey: STRIPE_API_KEY,
        webhookSecret: STRIPE_WEBHOOK_SECRET,
        capture: true, // Auto-capture payments
        automatic_payment_methods: true,
        payment_description: 'KCT Menswear Order'
      }
    }]
  }
}
```

## Step 4: Product Catalog Sync

### Initial Setup:
1. Import all products to Medusa via CSV
2. Export product IDs from Medusa
3. Update Supabase products table with Medusa IDs

### Ongoing Sync:
```sql
-- Add to Supabase products table
ALTER TABLE products 
ADD COLUMN medusa_product_id TEXT,
ADD COLUMN medusa_variant_id TEXT;

-- Create sync function
CREATE OR REPLACE FUNCTION sync_inventory_to_medusa()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Medusa API to update inventory
  PERFORM http_post(
    'https://your-medusa.railway.app/admin/inventory',
    json_build_object(
      'product_id', NEW.medusa_product_id,
      'quantity', NEW.quantity
    ),
    'Bearer YOUR_API_KEY'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Step 5: Testing Strategy

### Test Flow:
1. **Test Mode First**:
   - Use Stripe test keys
   - Place order on Vercel frontend
   - Verify order appears in Medusa admin
   - Check inventory updates

2. **Production Rollout**:
   - Switch to live Stripe keys
   - Monitor both webhooks
   - Verify sync is working

## Step 6: Monitoring & Maintenance

### Dashboard Setup:
- Stripe: Monitor both webhook endpoints
- Supabase: Check webhook function logs
- Medusa: Monitor order creation logs
- Railway: Check for sync errors

### Error Handling:
```javascript
// Add retry logic for failed syncs
async function syncWithRetry(data, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncToMedusa(data);
      break;
    } catch (error) {
      if (i === maxRetries - 1) {
        // Log to error tracking
        await logSyncError(error, data);
      }
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

## Benefits of This Approach:

1. **Single Payment Provider**: One Stripe account, unified reporting
2. **Dual Frontend Support**: Keep existing Vercel site while adding Medusa
3. **Centralized Inventory**: Medusa admin as single source of truth
4. **Gradual Migration**: Can slowly move features to Medusa
5. **No Downtime**: Both systems work during transition

## Alternative: Stripe Connect (If Needed)

If you need separate Stripe accounts:
- Use Stripe Connect to link accounts
- Parent account (Medusa) manages inventory
- Child account (Vercel) processes payments
- Automatic fee splitting and reconciliation

## Next Steps:

1. Add Medusa webhook endpoint to Stripe
2. Configure Stripe in Railway environment
3. Test with small order
4. Implement inventory sync
5. Monitor both systems

This approach lets you keep your existing frontend working while adding Medusa's powerful admin capabilities!