#!/bin/bash

# Simple script to import KCT products to your existing Medusa system

API_URL="https://backend-production-7441.up.railway.app"
EMAIL="admin@kctmenswear.com"
PASSWORD="127598"

echo "🔐 Logging in to Medusa..."
TOKEN=$(curl -s -X POST "$API_URL/auth/admin/emailpass" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Logged in successfully"

# Try to create a simple test product first
echo "📦 Creating test product..."

curl -X POST "$API_URL/admin/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "KCT Premium Navy Suit",
    "description": "Classic navy business suit",
    "handle": "kct-navy-suit",
    "variants": [{
      "title": "Size 40R",
      "sku": "KCT-SUIT-NAVY-40R"
    }]
  }'

echo ""
echo "✅ Check your admin panel for the new product!"
echo "Admin URL: $API_URL/app/"