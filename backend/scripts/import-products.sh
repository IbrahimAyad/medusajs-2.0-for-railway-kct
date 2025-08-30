#!/bin/bash

# Product Import Script for Medusa
# Uses the new createProductsWorkflow implementation

echo "🚀 Starting Product Import..."

# Default values
API_URL="${API_URL:-http://localhost:9000}"
CSV_FILE="${1:-../medusa-import-basic.csv}"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "❌ Error: CSV file not found: $CSV_FILE"
    echo "Usage: $0 [csv_file_path]"
    exit 1
fi

echo "📄 Reading CSV file: $CSV_FILE"

# Read CSV content
CSV_CONTENT=$(cat "$CSV_FILE")

# Escape the CSV content for JSON
CSV_JSON=$(echo "$CSV_CONTENT" | jq -Rs .)

# Create JSON payload
PAYLOAD=$(cat <<EOF
{
  "csv_content": $CSV_JSON
}
EOF
)

echo "📤 Sending import request to $API_URL/admin/import-products..."

# Send POST request
RESPONSE=$(curl -s -X POST "$API_URL/admin/import-products" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Check if curl succeeded
if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to connect to API"
    exit 1
fi

# Parse and display response
echo ""
echo "📊 Import Results:"
echo "=================="
echo "$RESPONSE" | jq '.'

# Extract summary if available
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
    CREATED=$(echo "$RESPONSE" | jq -r '.summary.created // 0')
    FAILED=$(echo "$RESPONSE" | jq -r '.summary.failed // 0')
    TOTAL=$(echo "$RESPONSE" | jq -r '.summary.total_products // 0')
    
    echo ""
    echo "✅ Import Successful!"
    echo "   Total Products: $TOTAL"
    echo "   Created: $CREATED"
    echo "   Failed: $FAILED"
else
    echo ""
    echo "❌ Import Failed!"
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
    MESSAGE=$(echo "$RESPONSE" | jq -r '.message // ""')
    echo "   Error: $ERROR"
    echo "   Message: $MESSAGE"
fi

echo ""
echo "✨ Done!"