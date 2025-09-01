#!/bin/bash

echo "🔧 Testing Customer Page Fix"
echo "============================"
echo ""

# Railway URL
RAILWAY_URL="${RAILWAY_URL:-https://medusajs-20-for-railway-boilerplate-production.up.railway.app}"

echo "Testing on: $RAILWAY_URL"
echo ""

# Test 1: List customers
echo "1. Testing customer list endpoint..."
CUSTOMERS=$(curl -s "$RAILWAY_URL/admin/customers?limit=5")
echo "$CUSTOMERS" | jq '.customers[] | {id, email, created_at}' 2>/dev/null || echo "Failed to get customers"

# Extract first customer ID
CUSTOMER_ID=$(echo "$CUSTOMERS" | jq -r '.customers[0].id' 2>/dev/null)

if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
    echo ""
    echo "2. Testing customer detail endpoint..."
    echo "   Customer ID: $CUSTOMER_ID"
    
    CUSTOMER_DETAIL=$(curl -s "$RAILWAY_URL/admin/customers/$CUSTOMER_ID")
    echo "$CUSTOMER_DETAIL" | jq '.customer | {id, email, first_name, last_name, stats}' 2>/dev/null || echo "$CUSTOMER_DETAIL"
    
    echo ""
    echo "3. Testing customer addresses endpoint..."
    ADDRESSES=$(curl -s "$RAILWAY_URL/admin/customers/$CUSTOMER_ID/addresses")
    echo "$ADDRESSES" | jq '.' 2>/dev/null || echo "$ADDRESSES"
else
    echo "⚠️  No customers found to test detail endpoints"
fi

echo ""
echo "4. Creating test customer..."
TEST_CUSTOMER=$(curl -s -X POST "$RAILWAY_URL/admin/customers" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@kctmenswear.com",
    "first_name": "Test",
    "last_name": "Customer",
    "phone": "555-0123"
  }')

echo "$TEST_CUSTOMER" | jq '.' 2>/dev/null || echo "$TEST_CUSTOMER"

echo ""
echo "✅ Customer endpoints test complete!"
echo ""
echo "Next steps:"
echo "1. Check your Medusa admin panel"
echo "2. Click on a customer - it should now work"
echo "3. The error page should be gone"