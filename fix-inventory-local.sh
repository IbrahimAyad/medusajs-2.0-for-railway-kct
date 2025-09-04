#!/bin/bash

echo "========================================="
echo "KCT Menswear - Inventory Fix Script"
echo "Processing all products in small batches"
echo "========================================="
echo ""

BACKEND_URL="https://backend-production-7441.up.railway.app"

# First, let's check the status
echo "Step 1: Checking current inventory status..."
echo "-------------------------------------------"
curl -s "$BACKEND_URL/inventory-status" | python3 -c "
import json, sys
data = json.load(sys.stdin)
totals = data.get('totals', {})
print(f\"Products checked: {totals.get('total_products_checked', 0)}\")
print(f\"Total variants: {totals.get('total_variants', 0)}\")
print(f\"Variants with manage_inventory=true: {totals.get('variants_manage_inventory_true', 0)}\")
print(f\"Variants with inventory items: {totals.get('variants_with_inventory', 0)}\")
print(f\"Variants with stock: {totals.get('variants_with_stock', 0)}\")
"

echo ""
echo "Step 2: Running quick inventory fix (first 20 products)..."
echo "-------------------------------------------"
echo "This will take about 30 seconds..."

# Run the quick fix
response=$(curl -s -X GET "$BACKEND_URL/quick-inventory-fix" --max-time 60 2>&1)

if [[ $? -eq 0 ]]; then
    echo "$response" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'success' in data and data['success']:
        results = data.get('results', {})
        print(f\"✓ Successfully processed {results.get('products_processed', 0)} products\")
        print(f\"  - Variants processed: {results.get('variants_processed', 0)}\")
        print(f\"  - Inventory items created: {results.get('inventory_created', 0)}\")
        print(f\"  - Inventory levels created: {results.get('levels_created', 0)}\")
        if 'samples' in results:
            print(f\"\\nSample products updated:\")
            for sample in results['samples'][:3]:
                print(f\"  • {sample['product']} - {sample['variant']}: {sample['quantity']} units\")
    else:
        print('Error:', data.get('message', 'Unknown error'))
except:
    print('Failed to parse response')
" 2>/dev/null || echo "Request timed out or failed"
else
    echo "⚠️ Request timed out. This is expected for large batches."
    echo "Some products may have been processed successfully."
fi

echo ""
echo "Step 3: Checking final status..."
echo "-------------------------------------------"

sleep 2

curl -s "$BACKEND_URL/inventory-status" | python3 -c "
import json, sys
data = json.load(sys.stdin)
totals = data.get('totals', {})
print(f\"Products checked: {totals.get('total_products_checked', 0)}\")
print(f\"Total variants: {totals.get('total_variants', 0)}\")
print(f\"Variants with inventory items: {totals.get('variants_with_inventory', 0)}\")
print(f\"Variants with stock: {totals.get('variants_with_stock', 0)}\")

if totals.get('variants_with_stock', 0) > 0:
    print(f\"\\n✅ SUCCESS: {totals.get('variants_with_stock', 0)} variants now have inventory!\")
    print(\"\\nSample products with inventory:\")
    for product in data.get('sample_products', [])[:2]:
        for variant in product['variants'][:2]:
            if variant['inventory_quantity'] > 0:
                print(f\"  • {product['title']} - {variant['title']}: {variant['inventory_quantity']} units\")
else:
    print(\"\\n⚠️ No inventory created yet. The operation may have timed out.\")
    print(\"You may need to run the full inventory setup from the admin panel.\")
"

echo ""
echo "========================================="
echo "Done!"
echo ""
echo "Note: If inventory wasn't created, it's likely due to timeout."
echo "The backend needs to process 201 products with 1000+ variants."
echo "Consider running smaller batches or using the admin panel."
echo "========================================="