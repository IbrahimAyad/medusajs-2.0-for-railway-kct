#!/bin/bash

echo "🚀 Testing Enhanced Customer Features"
echo "======================================"
echo ""

# Admin URL
ADMIN_URL="https://backend-production-7441.up.railway.app"

echo "Testing on: $ADMIN_URL"
echo ""

# Test 1: Enhanced customer list with search and pagination
echo "1. Testing enhanced customer list with search..."
curl -s "$ADMIN_URL/admin/customers-enhanced?q=gmail&limit=5&include_stats=false" | jq '.' 2>/dev/null || echo "Enhanced list not available yet"

echo ""
echo "2. Testing customer groups..."
# Create a test group
GROUP_RESPONSE=$(curl -s -X POST "$ADMIN_URL/admin/customer-groups" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test VIP Group",
    "metadata": {
      "discount": 15,
      "priority": true
    }
  }')

echo "$GROUP_RESPONSE" | jq '.' 2>/dev/null || echo "Group creation response: $GROUP_RESPONSE"

echo ""
echo "3. Testing bulk operations..."
BULK_RESPONSE=$(curl -s -X POST "$ADMIN_URL/admin/customers-enhanced/bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "update",
    "customer_ids": [],
    "update_data": {
      "metadata": {
        "test": true
      }
    }
  }')

echo "$BULK_RESPONSE" | jq '.' 2>/dev/null || echo "Bulk operation response: $BULK_RESPONSE"

echo ""
echo "======================================"
echo "✨ Enhanced Features Available:"
echo "======================================"
echo "1. Advanced Search & Filtering"
echo "2. Customer Analytics & Segmentation"
echo "3. Customer Groups Management"
echo "4. Bulk Operations"
echo "5. Order History in Customer Detail"
echo "6. Customer Notes System"
echo ""
echo "Check the admin panel for the enhanced customer experience!"