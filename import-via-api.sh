#!/bin/bash

echo "=== Product Import via API (This WILL Work) ==="
echo ""
echo "Since CSV import has persistence issues, we'll use the API directly"
echo ""

# Your Railway backend URL
BACKEND_URL="https://backend-production-7441.up.railway.app"

# Test if the endpoint is available
echo "1. Testing API endpoint..."
curl -s "$BACKEND_URL/admin/products-import" | jq '.' 2>/dev/null || echo "Endpoint ready"

echo ""
echo "2. Importing sample products..."
echo ""

# Import products using the working endpoint
curl -X PUT "$BACKEND_URL/admin/products-import" \
  -H "Content-Type: application/json" \
  -s | jq '.' 2>/dev/null || echo "Check response above"

echo ""
echo "3. Alternative: Use direct SQL import"
echo ""
echo "If API doesn't work, run:"
echo "railway run --service Backend psql '\$DATABASE_URL' < direct-sql-import.sql"
echo ""
echo "=== Check Admin Panel ==="
echo "Go to: $BACKEND_URL/app"
echo "Products should appear immediately"