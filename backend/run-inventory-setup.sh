#!/bin/bash

echo "==================================="
echo "KCT Menswear - Inventory Setup"
echo "==================================="
echo ""

BACKEND_URL="https://backend-production-7441.up.railway.app"
COOKIE="connect.sid=s%3ALyso2HtL-a4qycA62Bg_tVHblNA6Qsr9.%2FeLu5NAso4ZhLz%2FoS0juzmE7PzL0NSORpEi99JEejtw"

echo "Step 1: Checking current inventory status..."
echo "-----------------------------------"
curl -s -X GET "$BACKEND_URL/admin/setup-inventory" \
  -H "Cookie: $COOKIE" | python3 -m json.tool | head -30

echo ""
echo "Step 2: Ready to enable inventory for all products?"
echo "This will:"
echo "  - Enable manage_inventory for all variants"
echo "  - Create inventory items"
echo "  - Set 10 units per size at Kalamazoo store"
echo ""
read -p "Proceed? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Step 3: Running inventory setup..."
    echo "-----------------------------------"
    
    RESPONSE=$(curl -s -X POST "$BACKEND_URL/admin/setup-inventory" \
      -H "Cookie: $COOKIE" \
      -H 'Content-Type: application/json')
    
    echo "$RESPONSE" | python3 -m json.tool
    
    echo ""
    echo "Step 4: Verifying products now have inventory..."
    echo "-----------------------------------"
    
    # Test a product endpoint
    curl -s "$BACKEND_URL/pricing-status" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Products with inventory: {data.get(\"products_with_variants\", 0)}/{data.get(\"total_products\", 0)}')
for p in data.get('sample_products', [])[:3]:
    print(f'  - {p[\"title\"]}: {p.get(\"variant_count\", 0)} variants')
"
else
    echo "Cancelled."
fi

echo ""
echo "==================================="
echo "Done!"
echo "===================================="