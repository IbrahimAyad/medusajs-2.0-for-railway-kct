# Backend Deployment Guide - Pricing Fix

## Overview
This guide covers the deployment of the backend pricing fix that resolves the $0.00 price display issue.

## Backend Changes Applied

### File Modified
`/backend/src/api/store/products/route.ts`

### Changes Made
1. **Switched to Medusa 2.0 Remote Query API**
   - Uses proper Query module instead of direct database access
   - Follows Medusa's modular architecture

2. **Added Proper Price Expansion**
   ```javascript
   fields: [
     "*",
     "variants.*",
     "variants.calculated_price.*"  // Critical: Expands pricing data
   ]
   ```

3. **Included Region Context**
   ```javascript
   context: {
     region_id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'  // US region
   }
   ```

4. **Returns Prices in CENTS**
   - `product.price`: Minimum variant price (for listings)
   - `variant.calculated_price.calculated_amount`: Specific variant price

## Deployment Steps

### 1. Deploy Backend to Railway

```bash
# In backend directory
git add .
git commit -m "Fix: Product pricing using Medusa 2.0 Query API"
git push origin main

# Railway will auto-deploy from main branch
```

### 2. Wait for Cache Expiration
- Backend cache TTL: **60 seconds**
- Wait at least 60 seconds after deployment

### 3. Verify Deployment

#### Option A: Use Admin Cache Manager
1. Navigate to: `/admin/cache-manager`
2. Click "Check Backend Status"
3. Should show: "✅ Updated (New Pricing Active)"

#### Option B: Manual API Test
```bash
curl https://backend-production-7441.up.railway.app/store/products?limit=1
```

Expected response:
```json
{
  "products": [{
    "price": 19999,  // Should NOT be 0
    "variants": [{
      "calculated_price": {
        "calculated_amount": 19999,
        "currency_code": "usd"
      }
    }]
  }]
}
```

### 4. Clear Frontend Cache
After confirming backend is updated:

#### Option A: Use Admin Tool
1. Go to `/admin/cache-manager`
2. Click "Clear All Caches"
3. Page will auto-refresh

#### Option B: Manual Clear
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 5. Verify Prices Display

Check these pages:
- Homepage: Products should show actual prices (not $0.00)
- Product detail pages: Should show variant-specific prices
- Collections page: All products should have prices

## Frontend Changes Applied

### Updated Files
1. **`/src/utils/pricing.ts`**
   - Updated to handle new CENTS format
   - Proper priority order for price fields
   - Supports both product and variant pricing

2. **`/src/services/medusaBackendService.ts`**
   - Delegates to centralized pricing utility
   - Removed duplicate price logic

3. **`/src/utils/cache-clear.ts`**
   - Cache clearing utilities
   - Backend status checking
   - Auto-monitoring capability

## Price Data Structure

### Before (Always returned 0)
```javascript
{
  "price": 0,  // Was checking metadata.tier_price which doesn't exist
  "variants": [{
    // No price data
  }]
}
```

### After (Proper pricing)
```javascript
{
  "price": 19999,  // Minimum variant price in CENTS
  "variants": [{
    "calculated_price": {
      "calculated_amount": 19999,  // In CENTS
      "currency_code": "usd"
    }
  }]
}
```

## Frontend Price Display Logic

```javascript
// Priority order (all values in CENTS, divide by 100)
1. variant.calculated_price.calculated_amount  // Most accurate
2. variant.price                               // Fallback
3. product.price                               // For listings
```

## Monitoring Tools

### Admin Cache Manager
- URL: `/admin/cache-manager`
- Features:
  - Check backend status
  - Clear all caches
  - Auto-monitor for updates

### Auto-Monitor Script
```javascript
// Run in console to auto-detect backend update
import { monitorBackendUpdate } from '@/utils/cache-clear';
monitorBackendUpdate(30000); // Check every 30 seconds
```

## Rollback Plan

If issues occur after deployment:

1. **Revert Backend**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Frontend Fallback**
   - Frontend has backwards compatibility
   - Will continue to work with old structure
   - Just won't show correct prices

## Success Criteria

✅ Backend returns non-zero prices  
✅ Frontend displays correct prices ($199.99, not $0.00)  
✅ Cart calculations work correctly  
✅ No console errors related to pricing  

## Support

If issues persist:
1. Check Railway logs for backend errors
2. Verify region ID is correct
3. Ensure Pricing Module is properly configured in Medusa
4. Check that products have prices set in database

## Notes

- Cache TTL is 60 seconds (not 30 minutes as previously thought)
- Prices are stored in CENTS in database (19999 = $199.99)
- Frontend always divides by 100 for display
- All products have `manage_inventory: false` (unlimited stock)