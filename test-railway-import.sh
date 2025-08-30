#!/bin/bash

echo "🚀 Testing Product Import on Railway Deployment"
echo "=============================================="

# Get Railway URL from environment or use default
RAILWAY_URL="${RAILWAY_URL:-https://medusajs-20-for-railway-boilerplate-production.up.railway.app}"

echo "Using Railway URL: $RAILWAY_URL"
echo ""

# Test if the endpoint is accessible
echo "1. Testing endpoint availability..."
RESPONSE=$(curl -s "$RAILWAY_URL/admin/products-import")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "2. Importing sample menswear products..."

# Create product data
PRODUCTS_JSON='{
  "products": [
    {
      "title": "Executive Navy Suit",
      "handle": "executive-navy-suit",
      "description": "Premium wool navy suit for executives",
      "sizes": ["38R", "40R", "42R", "44R", "46R"],
      "basePrice": 799.99,
      "thumbnail": "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg",
      "category": "Premium Suits",
      "vendor": "KCT Executive"
    },
    {
      "title": "Wedding Black Tuxedo",
      "handle": "wedding-black-tux",
      "description": "Classic black tuxedo perfect for weddings",
      "sizes": ["38R", "40R", "42R", "44R"],
      "basePrice": 999.99,
      "thumbnail": "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg",
      "category": "Tuxedos",
      "vendor": "KCT Formal"
    }
  ]
}'

# Send POST request
echo "Sending import request..."
IMPORT_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/admin/products-import" \
  -H "Content-Type: application/json" \
  -d "$PRODUCTS_JSON")

echo "$IMPORT_RESPONSE" | jq '.' 2>/dev/null || echo "$IMPORT_RESPONSE"

echo ""
echo "3. Quick batch import (using PUT endpoint)..."
BATCH_RESPONSE=$(curl -s -X PUT "$RAILWAY_URL/admin/products-import/batch" \
  -H "Content-Type: application/json")

echo "$BATCH_RESPONSE" | jq '.' 2>/dev/null || echo "$BATCH_RESPONSE"

echo ""
echo "✅ Test complete! Check your Medusa admin panel."
echo "URL: $RAILWAY_URL/app"