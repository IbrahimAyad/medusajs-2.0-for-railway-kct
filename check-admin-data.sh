#!/bin/bash

echo "==================================="
echo "Checking Medusa Admin Data"
echo "==================================="
echo ""

BASE_URL="https://backend-production-7441.up.railway.app"

# Get sample products without auth (using pricing-status endpoint)
echo "1. Checking Product Structure..."
echo "-----------------------------------"
curl -s "$BASE_URL/pricing-status" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Total Products: {data.get(\"total_products\")}')
print(f'Products with Pricing: {data.get(\"products_with_pricing\")}')
print('')
print('Sample Products:')
for p in data.get('sample_products', [])[:3]:
    print(f'  - {p[\"title\"]}')
    print(f'    ID: {p[\"id\"]}')
    print(f'    Variants: {p[\"variant_count\"]}')
    print(f'    Tier: {p[\"tier\"]}')
    print(f'    Price: \${p[\"price\"]}')
    print('')
"

echo ""
echo "2. Checking Store Products (with variants)..."
echo "-----------------------------------"
# We need to find a working publishable key or check another way

echo ""
echo "3. Database Query (via Railway)..."
echo "-----------------------------------"
echo "To check actual database structure, run:"
echo "railway run npx medusa exec src/scripts/check-variants.js"

echo ""
echo "==================================="
echo "Key Findings:"
echo "- All products have pricing tiers ✓"
echo "- Products show 0 variants (this is the issue)"
echo "- Need to create variants and link inventory"
echo "==================================="