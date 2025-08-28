#!/bin/bash

# KCT Product Import Test Script
API_URL="https://backend-production-7441.up.railway.app"

# First, login to get token
echo "🔐 Logging in..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/emailpass" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kctmenswear.com","password":"127598"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Got auth token"

# Create a test product
echo "📦 Creating test product..."

PRODUCT_DATA='{
  "title": "KCT Classic Navy Suit",
  "handle": "kct-classic-navy-suit",
  "description": "Premium navy blue business suit with modern fit",
  "status": "published",
  "variants": [
    {
      "title": "Size 40R",
      "sku": "SUIT-NAVY-40R",
      "prices": [
        {
          "amount": 59900,
          "currency_code": "usd"
        }
      ]
    }
  ]
}'

RESULT=$(curl -s -X POST "$API_URL/admin/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PRODUCT_DATA")

if echo "$RESULT" | grep -q '"id"'; then
  echo "✅ Product created successfully!"
  echo $RESULT | python3 -m json.tool
else
  echo "❌ Failed to create product:"
  echo $RESULT
fi