#!/bin/bash

echo "Running product-to-tier mapping script on Railway..."

# First, get a preview of what will be mapped
echo "Getting preview of products to be mapped..."
railway run --service Backend "curl -X GET http://localhost:9000/admin/map-products-to-tiers -H 'x-medusa-access-token: test' 2>/dev/null | python3 -m json.tool | head -100"

echo ""
echo "Do you want to proceed with mapping all products to tiers? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    echo "Executing tier mapping..."
    railway run --service Backend "curl -X POST http://localhost:9000/admin/map-products-to-tiers -H 'x-medusa-access-token: test' 2>/dev/null | python3 -m json.tool"
    echo "Tier mapping completed!"
else
    echo "Tier mapping cancelled."
fi