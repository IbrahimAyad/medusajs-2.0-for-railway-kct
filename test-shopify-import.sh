#!/bin/bash

echo "=== Testing Shopify Import Endpoints ==="
echo ""

BASE_URL="https://backend-production-7441.up.railway.app"

# 1. Check vendor sync status
echo "1. Checking vendor sync configuration..."
curl -s "$BASE_URL/admin/vendor-sync" | jq '.' || echo "Failed to get status"

echo ""
echo "2. Listing available Shopify products..."
response=$(curl -s "$BASE_URL/admin/import-shopify")

if echo "$response" | jq -e '.products' > /dev/null 2>&1; then
    product_count=$(echo "$response" | jq '.count')
    echo "✓ Found $product_count products from Shopify"
    
    # Show first 3 products
    echo ""
    echo "Sample products:"
    echo "$response" | jq '.products[:3]'
    
    # Get first product ID for test import
    first_product_id=$(echo "$response" | jq -r '.products[0].shopify_id')
    
    if [ "$first_product_id" != "null" ] && [ -n "$first_product_id" ]; then
        echo ""
        echo "3. Testing import of single product (ID: $first_product_id)..."
        
        import_response=$(curl -s -X POST "$BASE_URL/admin/import-shopify" \
            -H "Content-Type: application/json" \
            -d "{\"shopify_ids\": [\"$first_product_id\"], \"import_all\": false}")
        
        echo "$import_response" | jq '.' || echo "$import_response"
        
        echo ""
        echo "4. Testing inventory update..."
        inventory_response=$(curl -s -X PUT "$BASE_URL/admin/import-shopify/inventory" \
            -H "Content-Type: application/json")
        
        echo "$inventory_response" | jq '.' || echo "$inventory_response"
    else
        echo "No products found to test import"
    fi
else
    echo "Error response:"
    echo "$response" | jq '.' || echo "$response"
fi

echo ""
echo "=== Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Check Railway logs for any errors"
echo "2. Verify products in admin panel at $BASE_URL/app"
echo "3. Set up scheduled sync (cron job or Railway scheduled job)"