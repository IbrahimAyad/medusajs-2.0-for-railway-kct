#!/bin/bash

echo "=== Shopify Vendor Product Sync ==="
echo ""

# Check sync status first
echo "1. Checking current status..."
curl -s https://backend-production-7441.up.railway.app/admin/trigger-shopify-sync | jq '.' || echo "Status check failed"

echo ""
echo "2. Triggering manual sync..."
response=$(curl -s -X POST https://backend-production-7441.up.railway.app/admin/trigger-shopify-sync \
  -H "Content-Type: application/json" \
  -H "x-medusa-access-token: create_token_here")

echo "$response" | jq '.' || echo "$response"

echo ""
echo "3. Checking Railway logs for sync progress..."
echo "   View logs at: https://railway.app/project/d0792b49-f30a-4c02-b8ab-01a202f9df4e"
echo ""
echo "4. After sync completes, check admin panel:"
echo "   https://backend-production-7441.up.railway.app/app"
echo "   Products > Filter by metadata.source = 'shopify'"
echo ""

# Alternative: Direct Shopify API check
echo "5. Verifying Shopify connection..."
echo "   Store: suits-inventory.myshopify.com"
echo "   Expected products: 800+"
echo ""

echo "=== Troubleshooting ==="
echo "If products don't appear:"
echo "1. Check Railway environment variables:"
echo "   - SHOPIFY_DOMAIN (should be suits-inventory.myshopify.com)"
echo "   - SHOPIFY_ACCESS_TOKEN (verify it's set in Railway - never hardcode!)"
echo "   - SHOPIFY_LOCATION_ID (should be set to your location ID)"
echo ""
echo "2. Check Railway logs for errors"
echo "3. The sync may take several minutes for 800+ products"
echo ""
echo "=== Security Note ==="
echo "NEVER hardcode API tokens in scripts!"
echo "All sensitive values should be in Railway environment variables only."