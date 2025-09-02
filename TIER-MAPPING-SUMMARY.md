# Product Tier Mapping System - Implementation Summary

## Overview
We've created a comprehensive system to map all 201 products in your Medusa backend to a 45-tier pricing structure with Stripe price IDs.

## What Was Built

### 1. Tier Mapping Endpoint
**Location:** `/backend/src/api/admin/map-products-to-tiers/route.ts`

This endpoint:
- Maps all 201 products to appropriate pricing tiers
- Stores tier information in product metadata:
  - `tier`: The tier name (e.g., "SUIT_STANDARD")
  - `tier_price`: The price value (e.g., 229.99)
  - `stripe_price_id`: The Stripe price ID for checkout
- Updates all variant prices to match the tier pricing
- Provides both GET (preview) and POST (execute) methods

### 2. The 45-Tier Pricing Structure

| Category | Tiers | Price Range |
|----------|-------|-------------|
| **Suits** | 6 tiers | $199.99 - $299.99 |
| **Tuxedos** | 8 tiers | $199.99 - $349.99 |
| **Shirts** | 5 tiers | $34.99 - $89.99 |
| **Accessories** | 10 tiers | $29.99 - $79.99 |
| **Shoes** | 3 tiers | $99.99 - $149.99 |
| **Outerwear** | 4 tiers | $149.99 - $349.99 |
| **Boy's** | 5 tiers | $99.99 - $179.99 |
| **Casual** | 4 tiers | $59.99 - $149.99 |

Each tier has:
- A descriptive name (e.g., "SUIT_STANDARD")
- A price value
- A Stripe price ID (e.g., "price_1S2zyaCHc12x7sCzKcu7dzIL")

### 3. Intelligent Tier Assignment Logic

The system uses product titles and categories to automatically assign the correct tier:

```typescript
// Example logic:
- "Pin Stripe Suit" → SUIT_STANDARD ($229.99)
- "Velvet Tuxedo" → TUXEDO_VELVET ($349.99)
- "Ultra Stretch Shirt" → SHIRT_STRETCH ($69.99)
- "Boy's 5pc Suit" → BOYS_SUIT_5PC ($149.99)
```

## How to Execute the Tier Mapping

### Option 1: Via Admin API (Requires Authentication)

```bash
# Get auth token first
TOKEN=$(curl -X POST https://backend-production-7441.up.railway.app/auth/user/emailpass \
  -H "Content-Type: application/json" \
  -d '{"email": "your-admin@email.com", "password": "your-password"}' \
  | jq -r '.token')

# Preview what will be mapped
curl -X GET https://backend-production-7441.up.railway.app/admin/map-products-to-tiers \
  -H "Authorization: Bearer $TOKEN"

# Execute the mapping
curl -X POST https://backend-production-7441.up.railway.app/admin/map-products-to-tiers \
  -H "Authorization: Bearer $TOKEN"
```

### Option 2: Via Medusa Admin UI

1. Access: https://backend-production-7441.up.railway.app/app
2. Login with admin credentials
3. Use browser dev tools to get auth token from network requests
4. Use the token with the curl commands above

### Option 3: Check Status (Public Endpoint)

```bash
# Check if tier mapping has been applied
curl https://backend-production-7441.up.railway.app/health-tier-check
```

## What Happens After Mapping

Once executed, each product will have:

1. **Metadata with Stripe Integration:**
   ```json
   {
     "tier": "SUIT_STANDARD",
     "tier_price": 229.99,
     "stripe_price_id": "price_1S2zyaCHc12x7sCzKcu7dzIL"
   }
   ```

2. **Updated Variant Prices:**
   - All variants of a product will have the same tier price
   - Prices are set in the default currency (USD)

3. **Ready for Stripe Checkout:**
   - Frontend can use the `stripe_price_id` directly with Stripe Checkout
   - No need to create prices on-the-fly

## Frontend Integration

The frontend can now:

1. **Display Products with Tier Pricing:**
   ```javascript
   const price = product.metadata?.tier_price || product.variants[0]?.prices[0]?.amount
   ```

2. **Use Stripe Price IDs for Checkout:**
   ```javascript
   const stripeItems = cart.items.map(item => ({
     price: item.product.metadata.stripe_price_id,
     quantity: item.quantity
   }))
   ```

3. **Show Tier Information:**
   ```javascript
   const tierName = product.metadata?.tier // e.g., "SUIT_STANDARD"
   ```

## Benefits of This System

1. **Consistency:** All similar products have the same price
2. **Stripe Integration:** Direct price IDs eliminate price creation errors
3. **Maintainability:** Change prices in one place (tier definition)
4. **Scalability:** Easy to add new tiers or adjust existing ones
5. **Performance:** No need to create Stripe prices during checkout

## Next Steps

1. **Execute the Mapping:** Run the POST endpoint to apply tiers to all products
2. **Verify:** Check a few products in the admin to confirm metadata
3. **Test Checkout:** Try a purchase with the new Stripe price IDs
4. **Monitor:** Use the health check endpoint to verify system status

## Troubleshooting

If products aren't mapping correctly:
1. Check product titles match the expected patterns
2. Verify Stripe price IDs are valid
3. Look at the tier assignment logic in the mapping script
4. Use the GET endpoint to preview before executing

## Related Files

- `/backend/src/api/admin/map-products-to-tiers/route.ts` - Main mapping logic
- `/backend/src/api/health-tier-check/route.ts` - Status check endpoint
- `/backend/src/api/admin/fix-missing-prices/route.ts` - Original price fix script
- `/backend/src/api/store/stripe-payment-fix/route.ts` - Stripe checkout implementation