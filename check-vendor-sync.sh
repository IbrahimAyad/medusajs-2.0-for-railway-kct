#!/bin/bash

# Check Vendor Sync deployment
echo "=== Checking Vendor Sync Deployment ==="
echo ""

# Backend health check
echo "1. Testing backend health..."
curl -s https://backend-production-7441.up.railway.app/health || echo "Backend health check failed"
echo ""

# Check admin panel
echo "2. Testing admin panel..."
curl -s -I https://backend-production-7441.up.railway.app/app | head -n 1
echo ""

# Check Shopify sync API endpoints
echo "3. Testing Shopify sync endpoints..."
echo "   - Products endpoint:"
curl -s https://backend-production-7441.up.railway.app/admin/shopify-products | jq '.' 2>/dev/null || echo "   Failed (authentication may be required)"
echo ""

echo "4. Admin panel URL:"
echo "   https://backend-production-7441.up.railway.app/app"
echo ""
echo "   Login and look for:"
echo "   - 'Vendor Sync' tab in the sidebar"
echo "   - Product list from suits-inventory.myshopify.com"
echo "   - Sync Now button to trigger manual sync"
echo ""

echo "=== Next Steps ==="
echo "1. Login to admin panel"
echo "2. Navigate to Vendor Sync tab"
echo "3. Review products from Shopify"
echo "4. Select products to import"
echo "5. Click 'Sync Now' to import selected products"