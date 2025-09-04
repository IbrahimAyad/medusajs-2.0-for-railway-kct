#!/bin/bash

echo "========================================="
echo "KCT Menswear - Batch Inventory Setup"
echo "Processing all 201 products in batches"
echo "========================================="
echo ""

BACKEND_URL="https://backend-production-7441.up.railway.app"
BATCH_SIZE=10
OFFSET=0
BATCH_COUNT=1
CONTINUE=true

# First check status
echo "Checking current inventory status..."
echo "-----------------------------------"
curl -s "$BACKEND_URL/batch-inventory-setup" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"Total products: {data.get('total_products', 0)}\")
sample = data.get('sample_check', {})
print(f\"Sample check: {sample.get('products_with_inventory', 0)}/{sample.get('products_checked', 0)} products have inventory\")
if sample.get('sample_products'):
    print(f\"Products with inventory: {', '.join(sample['sample_products'][:3])}\")
"

echo ""
echo "Starting batch processing..."
echo "-----------------------------------"
echo "Processing $BATCH_SIZE products per batch"
echo ""

# Process batches
while [ "$CONTINUE" = true ]; do
    echo "Batch $BATCH_COUNT (offset: $OFFSET)..."
    
    response=$(curl -s -X POST "$BACKEND_URL/batch-inventory-setup?batch_size=$BATCH_SIZE&offset=$OFFSET")
    
    # Parse response
    success=$(echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        results = data.get('results', {})
        progress = data.get('progress', {})
        print(f\"✓ Processed {results.get('products_processed', 0)} products, {results.get('variants_processed', 0)} variants\")
        print(f\"  Created {results.get('inventory_created', 0)} inventory items, {results.get('levels_created', 0)} stock levels\")
        if results.get('processed_products'):
            products = ', '.join(results['processed_products'][:3])
            if len(results['processed_products']) > 3:
                products += f\" and {len(results['processed_products']) - 3} more\"
            print(f\"  Products: {products}\")
        print(f\"  Progress: {progress.get('percent_complete', 0)}% complete ({progress.get('products_remaining', 0)} products remaining)\")
        
        # Return next offset or 'done'
        next_offset = progress.get('next_offset')
        if next_offset is not None:
            print(f\"NEXT:{next_offset}\")
        else:
            print(\"DONE\")
    else:
        print(f\"ERROR: {data.get('message', 'Unknown error')}\")
        print(\"DONE\")
except Exception as e:
    print(f\"ERROR: Failed to parse response - {e}\")
    print(\"DONE\")
" 2>/dev/null)
    
    # Check if we should continue
    if [[ "$success" == *"NEXT:"* ]]; then
        OFFSET=$(echo "$success" | grep "NEXT:" | cut -d: -f2)
        BATCH_COUNT=$((BATCH_COUNT + 1))
        echo ""
        sleep 2  # Small delay between batches
    elif [[ "$success" == *"ERROR:"* ]]; then
        echo "$success"
        CONTINUE=false
    else
        echo ""
        echo "✅ All batches processed!"
        CONTINUE=false
    fi
    
    # Safety limit - stop after 30 batches (300 products)
    if [ $BATCH_COUNT -gt 30 ]; then
        echo "⚠️ Reached batch limit (30 batches). Run script again to continue."
        CONTINUE=false
    fi
done

echo ""
echo "========================================="
echo "Final Status Check"
echo "========================================="

# Final verification
curl -s "$BACKEND_URL/batch-inventory-setup" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f\"Total products: {data.get('total_products', 0)}\")
sample = data.get('sample_check', {})
print(f\"Products with inventory: {sample.get('products_with_inventory', 0)}/{sample.get('products_checked', 0)} (from sample)\")
print(f\"Variants with inventory: {sample.get('variants_with_inventory', 0)}/{sample.get('variants_checked', 0)} (from sample)\")
"

echo ""
echo "========================================="
echo "Batch processing complete!"
echo "Run './run-batch-inventory.sh' again if needed"
echo "==========================================="