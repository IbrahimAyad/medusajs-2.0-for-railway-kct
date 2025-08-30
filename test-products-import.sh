#!/bin/bash

echo "=== Testing Product Import with createProductsWorkflow ==="
echo ""
echo "This uses the WORKING workflow that follows seed.ts pattern"
echo ""

BACKEND_URL="https://backend-production-7441.up.railway.app"

echo "Method 1: Import Sample Products (Quick Test)"
echo "============================================"
curl -X PUT "$BACKEND_URL/admin/products-import" \
  -H "Content-Type: application/json" \
  -s | jq '.'

echo ""
echo "Method 2: Import Custom Products"
echo "================================"
echo ""

read -p "Do you want to import custom products? (y/n): " choice

if [ "$choice" = "y" ]; then
  echo "Importing your suits..."
  
  curl -X POST "$BACKEND_URL/admin/products-import" \
    -H "Content-Type: application/json" \
    -d '{
      "products": [
        {
          "title": "2 PC Double Breasted Solid Suit",
          "handle": "double-breasted-charcoal",
          "description": "Versatile charcoal gray double-breasted suit. Perfect for business and formal events.",
          "sizes": ["36S", "36R", "38S", "38R", "38L", "40S", "40R", "40L", "42R", "42L", "44R", "44L", "46R"],
          "basePrice": 250.00,
          "thumbnail": "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg",
          "category": "Suits",
          "vendor": "Tazzio"
        },
        {
          "title": "2 PC Satin Shawl Collar Suit",  
          "handle": "satin-shawl-burgundy",
          "description": "Rich burgundy suit with satin shawl collar. Stand out at any formal occasion.",
          "sizes": ["38R", "40R", "42R", "44R"],
          "basePrice": 174.99,
          "thumbnail": "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg",
          "category": "Tuxedos",
          "vendor": "Tazzio"
        }
      ]
    }' \
    -s | jq '.'
fi

echo ""
echo "=== Check Results ==="
echo "Go to: $BACKEND_URL/app"
echo "Products should appear immediately!"
echo ""
echo "If products don't appear:"
echo "1. Make sure you created the Categories (Suits, Tuxedos)"
echo "2. Check that 'KCT Menswear' sales channel exists"
echo "3. Try refreshing the admin panel"