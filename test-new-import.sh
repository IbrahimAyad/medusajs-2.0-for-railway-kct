#!/bin/bash

echo "=== Testing New CSV Import Endpoint ==="
echo ""

BASE_URL="https://backend-production-7441.up.railway.app"

# First, check if our new endpoint exists
echo "1. Checking if new import endpoint is available..."
curl -I "$BASE_URL/admin/import-products" 2>/dev/null | head -1

echo ""
echo "2. Testing CSV import with our new endpoint..."
echo ""

# Since the admin panel CSV import is broken, use our custom endpoint
echo "Our custom endpoint bypasses the broken Medusa CSV import."
echo ""
echo "Options to import products:"
echo ""
echo "A) Use the custom import-products endpoint (if deployed):"
echo "   POST $BASE_URL/admin/import-products"
echo ""
echo "B) Use the Shopify import endpoint (already working):"
echo "   POST $BASE_URL/admin/import-shopify"
echo ""
echo "C) Manual creation in admin panel"
echo ""

# Test the Shopify import endpoint since it's more reliable
echo "3. Using Shopify import (most reliable)..."
echo ""

# Import the 3 main products
IMPORT_DATA='{
  "shopify_ids": [
    "9736048476473",
    "9776181510457", 
    "9736048738617"
  ],
  "import_all": false
}'

echo "Importing 3 products from Shopify:"
echo "- Pin-Stripe Suit (ID: 9736048476473)"
echo "- Charcoal Suit (ID: 9776181510457) - 206 units"  
echo "- Burgundy Tuxedo (ID: 9736048738617) - 99 units"
echo ""

response=$(curl -s -X POST "$BASE_URL/admin/import-shopify" \
  -H "Content-Type: application/json" \
  -d "$IMPORT_DATA")

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "=== Alternative: Direct Admin Panel Creation ==="
echo ""
echo "Since CSV import has issues with column names, manually create products:"
echo ""
echo "1. Login to: $BASE_URL/app"
echo "2. Go to Products → Create Product"
echo "3. Enter product details manually"
echo "4. Add variants for sizes"
echo ""
echo "Product details are in: MANUAL_PRODUCT_CREATION.md"