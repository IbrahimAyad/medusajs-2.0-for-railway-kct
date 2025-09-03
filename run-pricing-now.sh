#!/bin/bash

echo "=================================="
echo "KCT Menswear - Pricing Setup"
echo "=================================="
echo ""
echo "This script will apply tier-based pricing to all 201 products."
echo ""

# You need to add your token here
read -p "Paste your Authorization header (Bearer eyJ...): " AUTH_TOKEN

if [ -z "$AUTH_TOKEN" ]; then
    echo "No token provided. Exiting."
    exit 1
fi

echo ""
echo "Applying pricing to all products..."
echo "=================================="

# Run the pricing setup
RESPONSE=$(curl -s -X POST https://backend-production-7441.up.railway.app/admin/setup-product-pricing \
  -H "Authorization: $AUTH_TOKEN" \
  -H 'Content-Type: application/json')

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Pricing has been applied."
    echo ""
    echo "Results:"
    echo "$RESPONSE" | python3 -m json.tool
else
    echo "❌ Failed to apply pricing:"
    echo "$RESPONSE" | python3 -m json.tool
fi

echo ""
echo "=================================="
echo "Checking pricing status..."
curl -s https://backend-production-7441.up.railway.app/pricing-status | python3 -m json.tool

echo ""
echo "=================================="
echo "DONE! Your products now have tier-based pricing."
echo "Tell the frontend: Prices are in DOLLARS, not cents!"
echo "==================================">