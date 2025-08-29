#!/bin/bash

echo "=== Shopify Sync Diagnostic ==="
echo ""

# Check if Shopify env vars are set in Railway
echo "1. Checking Shopify configuration..."
curl -s https://backend-production-7441.up.railway.app/admin/shopify-status 2>/dev/null | jq '.' || echo "Cannot reach status endpoint"

echo ""
echo "2. Checking product count..."
curl -s https://backend-production-7441.up.railway.app/admin/vendor-products 2>/dev/null | jq '.' || echo "Vendor endpoint returned: Products should be in main Products section"

echo ""
echo "=== What to Check in Railway ==="
echo ""
echo "1. Go to Railway Dashboard"
echo "2. Click on Backend service"
echo "3. Go to 'Variables' tab"
echo "4. Verify these environment variables are set:"
echo "   - SHOPIFY_DOMAIN (your Shopify store domain)"
echo "   - SHOPIFY_ACCESS_TOKEN (keep this secret!)"
echo "   - SHOPIFY_LOCATION_ID (your location ID)"
echo ""
echo "5. Click 'Deploy Logs' tab"
echo "6. Search for 'shopify' or 'sync' to see if sync is running"
echo ""
echo "=== Security Note ==="
echo "NEVER hardcode API tokens in scripts or commit them to git!"
echo "Always use environment variables in Railway"