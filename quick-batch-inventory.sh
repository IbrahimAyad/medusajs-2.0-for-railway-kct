#!/bin/bash

echo "========================================="
echo "Quick Batch Inventory Setup"
echo "========================================="

BACKEND_URL="https://backend-production-7441.up.railway.app"

# Process batches with smaller size and timeout handling
for offset in 0 10 20 30 40 50 60 70 80 90 100 110 120 130 140 150 160 170 180 190 200; do
    echo "Processing offset $offset (products $offset-$((offset+9)))..."
    
    curl -X POST "$BACKEND_URL/batch-inventory-setup?batch_size=10&offset=$offset" \
        --max-time 30 \
        --silent \
        --show-error 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        r = data.get('results', {})
        p = data.get('progress', {})
        print(f'  ✓ Processed {r.get(\"products_processed\", 0)} products')
        print(f'  Progress: {p.get(\"percent_complete\", 0)}%')
except:
    print('  ⚠️ Batch timed out or failed')
" || echo "  ⚠️ Request timed out"
    
    sleep 2
done

echo ""
echo "========================================="
echo "Checking final status..."
echo "========================================="

curl -s "$BACKEND_URL/batch-inventory-setup" | python3 -c "
import json, sys
data = json.load(sys.stdin)
sample = data.get('sample_check', {})
print(f'Products with inventory: {sample.get(\"products_with_inventory\", 0)}/{sample.get(\"products_checked\", 0)}')
print(f'Variants with stock: {sample.get(\"variants_with_inventory\", 0)}')
"

echo "========================================="
echo "Done!"
echo "==========================================="