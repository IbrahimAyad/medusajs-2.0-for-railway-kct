#!/bin/bash

echo "🔍 Testing Admin Customer Endpoints"
echo "===================================="
echo ""

# Railway URL for admin endpoints
ADMIN_URL="https://backend-production-7441.up.railway.app"

echo "Testing on: $ADMIN_URL"
echo ""

# Test 1: List customers through admin API
echo "1. Testing admin customer list endpoint..."
CUSTOMERS=$(curl -s "$ADMIN_URL/admin/customers?limit=5")
if echo "$CUSTOMERS" | jq -e '.customers' >/dev/null 2>&1; then
    echo "✅ Customer list endpoint working!"
    echo "   Found $(echo "$CUSTOMERS" | jq '.count') total customers"
    echo "$CUSTOMERS" | jq '.customers[] | {id, email, created_at}' 2>/dev/null
else
    echo "❌ Failed to get customers"
    echo "$CUSTOMERS"
fi

# Extract first customer ID
CUSTOMER_ID=$(echo "$CUSTOMERS" | jq -r '.customers[0].id' 2>/dev/null)

if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
    echo ""
    echo "2. Testing customer detail endpoint..."
    echo "   Customer ID: $CUSTOMER_ID"
    
    CUSTOMER_DETAIL=$(curl -s "$ADMIN_URL/admin/customers/$CUSTOMER_ID")
    if echo "$CUSTOMER_DETAIL" | jq -e '.customer' >/dev/null 2>&1; then
        echo "✅ Customer detail endpoint working!"
        echo "$CUSTOMER_DETAIL" | jq '.customer | {id, email, first_name, last_name}' 2>/dev/null
    else
        echo "❌ Failed to get customer details"
        echo "$CUSTOMER_DETAIL"
    fi
    
    echo ""
    echo "3. Testing customer addresses endpoint..."
    ADDRESSES=$(curl -s "$ADMIN_URL/admin/customers/$CUSTOMER_ID/addresses")
    if echo "$ADDRESSES" | jq -e '.addresses' >/dev/null 2>&1; then
        echo "✅ Customer addresses endpoint working!"
        ADDRESS_COUNT=$(echo "$ADDRESSES" | jq '.addresses | length')
        echo "   Customer has $ADDRESS_COUNT addresses"
    else
        echo "❌ Failed to get addresses"
        echo "$ADDRESSES"
    fi
else
    echo "⚠️  No customers found to test detail endpoints"
fi

echo ""
echo "4. Testing customer creation..."
TEST_EMAIL="test$(date +%s)@kctmenswear.com"
CREATE_RESPONSE=$(curl -s -X POST "$ADMIN_URL/admin/customers" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"first_name\": \"Test\",
    \"last_name\": \"Customer\",
    \"phone\": \"555-0123\"
  }")

if echo "$CREATE_RESPONSE" | jq -e '.customer' >/dev/null 2>&1; then
    echo "✅ Customer creation working!"
    NEW_CUSTOMER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.customer.id')
    echo "   Created customer: $TEST_EMAIL (ID: $NEW_CUSTOMER_ID)"
    
    # Test update
    echo ""
    echo "5. Testing customer update..."
    UPDATE_RESPONSE=$(curl -s -X POST "$ADMIN_URL/admin/customers/$NEW_CUSTOMER_ID" \
      -H "Content-Type: application/json" \
      -d "{
        \"first_name\": \"Updated\",
        \"last_name\": \"Name\"
      }")
    
    if echo "$UPDATE_RESPONSE" | jq -e '.customer' >/dev/null 2>&1; then
        echo "✅ Customer update working!"
        echo "   Updated name: $(echo "$UPDATE_RESPONSE" | jq -r '.customer.first_name') $(echo "$UPDATE_RESPONSE" | jq -r '.customer.last_name')"
    else
        echo "❌ Failed to update customer"
    fi
    
    # Test delete
    echo ""
    echo "6. Testing customer deletion..."
    DELETE_RESPONSE=$(curl -s -X DELETE "$ADMIN_URL/admin/customers/$NEW_CUSTOMER_ID")
    
    if echo "$DELETE_RESPONSE" | jq -e '.deleted' >/dev/null 2>&1; then
        echo "✅ Customer deletion working!"
    else
        echo "❌ Failed to delete customer"
    fi
else
    echo "❌ Failed to create customer"
    echo "$CREATE_RESPONSE"
fi

echo ""
echo "==================================="
echo "📊 Summary:"
echo "==================================="
echo "Customer endpoints are accessible at:"
echo "- List: GET $ADMIN_URL/admin/customers"
echo "- Detail: GET $ADMIN_URL/admin/customers/:id"
echo "- Create: POST $ADMIN_URL/admin/customers"
echo "- Update: POST $ADMIN_URL/admin/customers/:id"
echo "- Delete: DELETE $ADMIN_URL/admin/customers/:id"
echo "- Addresses: GET $ADMIN_URL/admin/customers/:id/addresses"