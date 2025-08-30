#!/bin/bash

echo "=== KCT Menswear - Shopify Product Import Tool ==="
echo ""

BASE_URL="https://backend-production-7441.up.railway.app"

# Function to display product selection
show_products() {
    echo "Sample products available for import:"
    echo ""
    echo "1. 2 PC Double Breasted Pin-Stripe Suit (ID: 9736048476473) - $174.99 - 18 in stock"
    echo "2. 2 PC Double Breasted Solid Suit (ID: 9756412838201) - $250.00 - 24 in stock"
    echo "3. 2 PC Satin Shawl Collar Suit (ID: 9736048607545) - $174.99 - 76 in stock"
    echo "4. 2 PC Double Breasted Solid Suit (ID: 9776181510457) - $250.00 - 206 in stock"
    echo ""
}

# Function to import specific products
import_products() {
    local product_ids="$1"
    
    echo "Importing selected products..."
    curl -X POST "$BASE_URL/admin/import-shopify" \
        -H "Content-Type: application/json" \
        -d "{\"shopify_ids\": $product_ids, \"import_all\": false}" \
        -s | jq '.' || echo "Import request sent"
}

# Function to update inventory
update_inventory() {
    echo "Updating inventory levels from Shopify..."
    curl -X PUT "$BASE_URL/admin/import-shopify/inventory" \
        -H "Content-Type: application/json" \
        -s | jq '.' || echo "Inventory update request sent"
}

# Main menu
echo "What would you like to do?"
echo "1. View all available products (250 items)"
echo "2. Import specific products"
echo "3. Import ALL products (250 items)"
echo "4. Update inventory for existing products"
echo "5. Check sync status"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "Fetching all products from Shopify..."
        curl -s "$BASE_URL/admin/import-shopify" | jq '.products[:10]'
        echo ""
        echo "Showing first 10 of 250 products. Full list available via API."
        ;;
    2)
        show_products
        echo "Enter product IDs to import (comma-separated):"
        echo "Example: 9736048476473,9756412838201"
        read -p "Product IDs: " ids
        
        # Convert comma-separated to JSON array
        json_array="[$(echo $ids | sed 's/,/","/g' | sed 's/^/"/;s/$/"/')]"
        import_products "$json_array"
        ;;
    3)
        read -p "Are you sure you want to import ALL 250 products? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            echo "Importing all products..."
            curl -X POST "$BASE_URL/admin/import-shopify" \
                -H "Content-Type: application/json" \
                -d '{"import_all": true}' \
                -s | jq '.'
        else
            echo "Cancelled"
        fi
        ;;
    4)
        update_inventory
        ;;
    5)
        echo "Checking sync status..."
        curl -s "$BASE_URL/admin/vendor-sync" | jq '.'
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

echo ""
echo "=== Notes ==="
echo "- You have 250 products available (showing first batch)"
echo "- Most products have good inventory levels"
echo "- Products range from \$174.99 to \$250.00"
echo "- Run inventory sync 2x weekly for accuracy"