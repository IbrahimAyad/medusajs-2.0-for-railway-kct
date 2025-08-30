#!/bin/bash

echo "=== Direct Shopify Product Import ==="
echo "Bypassing CSV import - Using API directly"
echo ""

BASE_URL="https://backend-production-7441.up.railway.app"

# Test products to import (the same ones from your CSV)
PRODUCT_IDS=(
  "9736048476473"  # Pin-Stripe Suit
  "9776181510457"  # Charcoal Suit (206 units)
  "9736048738617"  # Burgundy Tuxedo (99 units)
)

echo "Products to import:"
echo "1. Pin-Stripe Suit (ID: 9736048476473)"
echo "2. Charcoal Solid Suit (ID: 9776181510457) - HIGH STOCK"
echo "3. Burgundy Shawl Collar (ID: 9736048738617)"
echo ""

# Step 1: Check if Shopify is configured
echo "Step 1: Checking Shopify configuration..."
CONFIG_RESPONSE=$(curl -s "$BASE_URL/admin/vendor-sync")
echo "$CONFIG_RESPONSE" | jq '.shopify_config' 2>/dev/null || echo "Auth required - that's OK"

echo ""
echo "Step 2: Attempting to import products via API..."
echo "Note: This may require authentication"

# Convert array to JSON format
PRODUCT_JSON=$(printf '"%s",' "${PRODUCT_IDS[@]}" | sed 's/,$//')

# Make the import request
curl -X POST "$BASE_URL/admin/import-shopify" \
  -H "Content-Type: application/json" \
  -d "{
    \"shopify_ids\": [$PRODUCT_JSON],
    \"import_all\": false
  }" \
  -s | jq '.' || echo "Request sent - check admin panel"

echo ""
echo "=== Alternative: Manual Database Insert ==="
echo ""
echo "Since CSV import has transaction issues, you can:"
echo ""
echo "1. Use the Shopify import endpoint (above)"
echo "2. Access Railway database directly"
echo "3. Use Medusa CLI to create products"
echo ""
echo "To check if products were imported:"
echo "- Go to: $BASE_URL/app"
echo "- Navigate to Products"
echo "- Look for handles: mens-suit-m396sk-02, mens-suit-m404sk-03, mens-suit-m341sk-06"
echo ""
echo "=== Direct Database Option ==="
echo "railway run npx medusa exec ./create-products.js"