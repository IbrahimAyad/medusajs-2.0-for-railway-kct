#!/bin/bash

echo "Testing CSV Import with createProductsWorkflow"
echo "=============================================="
echo ""

# Test the GET endpoint first
echo "1. Testing GET endpoint..."
curl -s http://localhost:9000/admin/import-products | jq '.'

echo ""
echo "2. Testing POST with sample CSV data..."

# Create a simple test CSV
cat > /tmp/test-products.csv << 'EOF'
Product title,Product handle,Product description,Variant sku,Price USD,Option 1 name,Option 1 value
Test Suit,test-suit-001,A test suit for import,TEST-SUIT-38R,299.99,Size,38R
Test Suit,test-suit-001,A test suit for import,TEST-SUIT-40R,299.99,Size,40R
Test Shirt,test-shirt-001,A test shirt for import,TEST-SHIRT-M,49.99,Size,M
Test Shirt,test-shirt-001,A test shirt for import,TEST-SHIRT-L,49.99,Size,L
EOF

echo "Created test CSV with 2 products (4 variants total)"
echo ""

# Import the test CSV
echo "3. Importing test products..."
CSV_CONTENT=$(cat /tmp/test-products.csv)
RESPONSE=$(curl -s -X POST http://localhost:9000/admin/import-products \
  -H "Content-Type: application/json" \
  -d "{\"csv_content\": $(echo "$CSV_CONTENT" | jq -Rs .)}")

echo "$RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "✅ Test import successful!"
else
    echo ""
    echo "❌ Test import failed!"
fi

echo ""
echo "4. To import your actual CSV files, run:"
echo "   ./scripts/import-products.sh ../medusa-import-basic.csv"
echo ""