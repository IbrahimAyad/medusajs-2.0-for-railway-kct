#!/bin/bash

# Setup Product Pricing Script
# Run this after deployment to apply tier-based pricing to all products

BACKEND_URL="https://backend-production-7441.up.railway.app"

echo "=================================="
echo "Product Pricing Setup Script"
echo "=================================="
echo ""

# Step 1: Check backend health
echo "1. Checking backend health..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ "$HEALTH" == "200" ]; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is not responding. Please check deployment."
    exit 1
fi

# Step 2: Preview pricing setup
echo ""
echo "2. Getting pricing preview..."
echo "--------------------------------"
curl -s $BACKEND_URL/admin/setup-product-pricing | python3 -m json.tool | head -30
echo "..."
echo ""

# Step 3: Ask for confirmation
echo "3. Ready to apply pricing to all products?"
echo "This will:"
echo "  - Create PriceSets for all product variants"
echo "  - Assign tier-based pricing (45 tiers)"
echo "  - Store tier information in metadata"
echo ""
read -p "Proceed? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "4. Applying pricing to products..."
    echo "--------------------------------"
    
    RESPONSE=$(curl -s -X POST $BACKEND_URL/admin/setup-product-pricing)
    
    # Check if successful
    SUCCESS=$(echo $RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('success', False))")
    
    if [ "$SUCCESS" == "True" ]; then
        echo "✅ Pricing setup completed successfully!"
        echo ""
        echo "Results:"
        echo $RESPONSE | python3 -m json.tool
    else
        echo "❌ Pricing setup failed:"
        echo $RESPONSE | python3 -m json.tool
    fi
else
    echo "Cancelled."
fi

echo ""
echo "=================================="
echo "Next Steps:"
echo "1. Test product display in admin"
echo "2. Create a test cart"
echo "3. Test checkout flow"
echo "=================================="