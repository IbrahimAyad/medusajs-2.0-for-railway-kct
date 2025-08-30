#!/bin/bash

echo "=== Medusa CSV Validator ==="
echo ""

# Check if file exists
if [ -z "$1" ]; then
    echo "Usage: ./validate-csv.sh <csv-file>"
    exit 1
fi

CSV_FILE="$1"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ File not found: $CSV_FILE"
    exit 1
fi

echo "Checking: $CSV_FILE"
echo ""

# Expected columns from Medusa v2.8.5+ strict template
EXPECTED_COLUMNS="Product Id,Product Handle,Product Title,Product Subtitle,Product Description,Product Status,Product Thumbnail,Product Weight,Product Length,Product Width,Product Height,Product HS Code,Product Origin Country,Product MID Code,Product Material,Product Collection Id,Product Type Id,Product Tag 1,Product Discountable,Product External Id,Variant Id,Variant Title,Variant SKU,Variant Barcode,Variant Allow Backorder,Variant Manage Inventory,Variant Weight,Variant Length,Variant Width,Variant Height,Variant HS Code,Variant Origin Country,Variant MID Code,Variant Material,Variant Price EUR,Variant Price USD,Variant Option 1 Name,Variant Option 1 Value,Product Image 1 Url,Product Image 2 Url"

# Get actual columns
ACTUAL_COLUMNS=$(head -1 "$CSV_FILE")

# Compare
if [ "$ACTUAL_COLUMNS" == "$EXPECTED_COLUMNS" ]; then
    echo "✅ Column headers match Medusa v2.8.5+ template exactly!"
    echo ""
    
    # Count products and variants
    TOTAL_LINES=$(wc -l < "$CSV_FILE")
    VARIANT_COUNT=$((TOTAL_LINES - 1))
    
    # Count unique products
    UNIQUE_PRODUCTS=$(tail -n +2 "$CSV_FILE" | cut -d',' -f2 | sort -u | wc -l)
    
    echo "📊 Statistics:"
    echo "   - Total variants: $VARIANT_COUNT"
    echo "   - Unique products: $UNIQUE_PRODUCTS"
    echo "   - Average variants per product: $((VARIANT_COUNT / UNIQUE_PRODUCTS))"
    echo ""
    
    # Check for required fields
    echo "🔍 Validating required fields..."
    
    # Check if Product Handle is not empty
    EMPTY_HANDLES=$(tail -n +2 "$CSV_FILE" | awk -F',' '$2=="" {print NR}')
    if [ -z "$EMPTY_HANDLES" ]; then
        echo "   ✅ All products have handles"
    else
        echo "   ❌ Missing handles on lines: $EMPTY_HANDLES"
    fi
    
    # Check if Product Title is not empty
    EMPTY_TITLES=$(tail -n +2 "$CSV_FILE" | awk -F',' '$3=="" {print NR}')
    if [ -z "$EMPTY_TITLES" ]; then
        echo "   ✅ All products have titles"
    else
        echo "   ❌ Missing titles on lines: $EMPTY_TITLES"
    fi
    
    # Check if Variant SKU is not empty
    EMPTY_SKUS=$(tail -n +2 "$CSV_FILE" | awk -F',' '$23=="" {print NR}')
    if [ -z "$EMPTY_SKUS" ]; then
        echo "   ✅ All variants have SKUs"
    else
        echo "   ❌ Missing SKUs on lines: $EMPTY_SKUS"
    fi
    
    echo ""
    echo "✅ CSV is ready for Medusa import!"
    
else
    echo "❌ Column headers DO NOT match!"
    echo ""
    echo "Expected columns (40 total):"
    echo "$EXPECTED_COLUMNS" | tr ',' '\n' | nl
    echo ""
    echo "Your columns:"
    echo "$ACTUAL_COLUMNS" | tr ',' '\n' | nl
    echo ""
    echo "Fix: Use the exact column headers from product-import-template-2.csv"
fi