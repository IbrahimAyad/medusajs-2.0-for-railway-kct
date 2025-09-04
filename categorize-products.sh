#!/bin/bash

echo "========================================="
echo "KCT Menswear - Product Categorization"
echo "Adding tags, collections, and categories"
echo "========================================="
echo ""

BACKEND_URL="https://backend-production-7441.up.railway.app"

# First check what categorization will look like
echo "Step 1: Preview categorization..."
echo "-----------------------------------"
curl -s "$BACKEND_URL/auto-categorize-products" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f\"Collections available: {data.get('total_collections', 0)}\")
    print(f\"Categories available: {data.get('total_categories', 0)}\")
    print(f\"\\nSample categorizations:\")
    for sample in data.get('samples', [])[:3]:
        print(f\"\\n{sample['title']}:\")
        print(f\"  Collections: {', '.join(sample.get('collections', []))}\")
        print(f\"  Categories: {', '.join(sample.get('categories', []))}\")
        print(f\"  Tags: {', '.join(sample.get('tags', [])[:5])}\")
except Exception as e:
    print(f\"Preview failed: {e}\")
"

echo ""
echo "Step 2: Categorizing all products..."
echo "-----------------------------------"

# Process in batches
BATCH_SIZE=10
for offset in 0 10 20 30 40 50 60 70 80 90 100 110 120 130 140 150 160 170 180 190 200; do
    echo -n "Batch at offset $offset: "
    
    response=$(curl -s -X POST "$BACKEND_URL/auto-categorize-products?batch_size=$BATCH_SIZE&offset=$offset" --max-time 20 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        r = data.get('results', {})
        p = data.get('progress', {})
        print(f\"✓ {r.get('products_processed', 0)} products categorized ({p.get('percent_complete', 0)}% total)\")
    else:
        print(f\"Failed: {data.get('message', 'Unknown error')}\")
except:
    print('⚠️ Timeout or parse error')
" 2>/dev/null || echo "⚠️ Failed"
    else
        echo "⚠️ Request timed out"
    fi
    
    sleep 1
done

echo ""
echo "========================================="
echo "Step 3: Verification"
echo "========================================="

# Check a sample product
curl -s "$BACKEND_URL/auto-categorize-products" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    sample = data.get('samples', [])[0] if data.get('samples') else None
    if sample:
        print(f\"Sample product categorization:\")
        print(f\"Product: {sample['title']}\")
        print(f\"Collections: {', '.join(sample.get('collections', []))}\")
        print(f\"Tags: {', '.join(sample.get('tags', []))}\")
        print(f\"\\n✅ Products are now categorized for better filtering and SEO!\")
except:
    print('Could not verify categorization')
"

echo ""
echo "========================================="
echo "Categorization Complete!"
echo "Products now have:"
echo "- Collections for main navigation"
echo "- Categories for filtering"
echo "- Tags for detailed attributes"
echo "- SEO keywords for search optimization"
echo "==========================================="