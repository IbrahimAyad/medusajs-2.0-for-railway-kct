#!/usr/bin/env python3
"""
Check Shopify vendor products for specific SKUs
"""
import requests
import json
import os

# Shopify API configuration
SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"
# Note: In production, this would come from environment variables
# SHOPIFY_ACCESS_TOKEN = os.getenv('SHOPIFY_ACCESS_TOKEN')

# Target SKUs to search for
target_skus = [
    "MJ425S", "SMJ830H1", "MJ430S", "MJ428S", "MJ427S", "MJ426S",
    "SMJ831H1", "SMJ832H1", "SMJ833H1", "SM164H1", "SM179H1", "SM197H1"
]

def search_products_by_sku(access_token):
    """Search Shopify products for target SKUs"""
    url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json"
    headers = {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
    }
    
    params = {'limit': 250}
    found_products = []
    sample_products = []
    
    try:
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 401:
            print("❌ Authentication failed. Need valid SHOPIFY_ACCESS_TOKEN.")
            return None, None
            
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return None, None
            
        data = response.json()
        products = data.get('products', [])
        
        print(f"✅ Found {len(products)} total products in Shopify vendor catalog")
        
        # Get sample products to understand SKU patterns
        for i, product in enumerate(products[:10]):  # First 10 products
            variants_info = []
            for variant in product.get('variants', [])[:3]:  # First 3 variants
                variants_info.append({
                    'sku': variant.get('sku', 'No SKU'),
                    'title': variant.get('title'),
                    'price': variant.get('price'),
                    'inventory': variant.get('inventory_quantity', 0)
                })
            
            sample_products.append({
                'title': product.get('title'),
                'variants': variants_info,
                'created_at': product.get('created_at')
            })
        
        # Search for target SKUs and similar patterns
        for product in products:
            # Check product title and variants for SKUs
            product_match = False
            variant_matches = []
            
            # Check if SKU is in product title
            for sku in target_skus:
                if sku.lower() in product.get('title', '').lower():
                    product_match = True
                    break
            
            # Check variants for SKU matches (exact and partial)
            for variant in product.get('variants', []):
                variant_sku = variant.get('sku', '').upper()
                
                # Exact match
                if variant_sku in target_skus:
                    variant_matches.append({
                        'sku': variant_sku,
                        'match_type': 'exact',
                        'price': variant.get('price'),
                        'inventory': variant.get('inventory_quantity', 0),
                        'id': variant.get('id')
                    })
                    product_match = True
                
                # Partial match for similar patterns (MJ, SMJ, SM series)
                else:
                    for target_sku in target_skus:
                        # Check if the variant SKU contains the base pattern
                        if target_sku.startswith('MJ') and variant_sku.startswith('MJ'):
                            if target_sku[:4] in variant_sku:  # Match MJ425, etc.
                                variant_matches.append({
                                    'sku': variant_sku,
                                    'match_type': 'partial',
                                    'target': target_sku,
                                    'price': variant.get('price'),
                                    'inventory': variant.get('inventory_quantity', 0),
                                    'id': variant.get('id')
                                })
                                product_match = True
                        elif target_sku.startswith('SMJ') and variant_sku.startswith('SMJ'):
                            if target_sku[:6] in variant_sku:  # Match SMJ830, etc.
                                variant_matches.append({
                                    'sku': variant_sku,
                                    'match_type': 'partial',
                                    'target': target_sku,
                                    'price': variant.get('price'),
                                    'inventory': variant.get('inventory_quantity', 0),
                                    'id': variant.get('id')
                                })
                                product_match = True
                        elif target_sku.startswith('SM') and variant_sku.startswith('SM'):
                            if target_sku[:5] in variant_sku:  # Match SM164, etc.
                                variant_matches.append({
                                    'sku': variant_sku,
                                    'match_type': 'partial',
                                    'target': target_sku,
                                    'price': variant.get('price'),
                                    'inventory': variant.get('inventory_quantity', 0),
                                    'id': variant.get('id')
                                })
                                product_match = True
            
            if product_match:
                found_products.append({
                    'shopify_id': product.get('id'),
                    'title': product.get('title'),
                    'handle': product.get('handle'),
                    'vendor': product.get('vendor'),
                    'product_type': product.get('product_type'),
                    'variants_count': len(product.get('variants', [])),
                    'matching_variants': variant_matches,
                    'created_at': product.get('created_at'),
                    'image': product.get('images', [{}])[0].get('src') if product.get('images') else None
                })
        
        return found_products, sample_products
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("🔍 Searching Shopify vendor catalog for target SKUs...")
    print(f"Target SKUs: {', '.join(target_skus)}")
    print()
    
    # This script would need the actual access token from production environment
    print("⚠️  This script requires SHOPIFY_ACCESS_TOKEN environment variable")
    print("   In production, this would be available from Railway environment")
    print()
    print("   To run with actual credentials:")
    print("   export SHOPIFY_ACCESS_TOKEN='your_token_here'")
    print("   python3 check_shopify_skus.py")
    print()
    
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')
    if not access_token:
        print("❌ No access token provided. Cannot query Shopify API.")
        print()
        print("📋 Summary of what this script would do:")
        print("   1. Connect to suits-inventory.myshopify.com")
        print("   2. Fetch all products (limit 250)")
        print("   3. Search product titles and variant SKUs for matches")
        print("   4. Return matching products with pricing and inventory")
        return
    
    found_products, sample_products = search_products_by_sku(access_token)
    
    if found_products is None:
        return
    
    # Show sample products first to understand SKU patterns
    print("📋 Sample products from vendor catalog (first 10):")
    for i, product in enumerate(sample_products, 1):
        print(f"{i}. {product['title'][:50]}...")
        for variant in product['variants']:
            print(f"   SKU: {variant['sku']} | ${variant['price']} | Stock: {variant['inventory']}")
        print()
    
    print("-" * 60)
    print()
        
    if not found_products:
        print("❌ No products found matching target SKUs")
        print("   This could mean:")
        print("   - SKUs don't exist in this vendor catalog")  
        print("   - SKUs use different naming pattern")
        print("   - Products are in a different page (limit=250)")
        return
    
    print(f"✅ Found {len(found_products)} matching products:")
    print()
    
    for product in found_products:
        print(f"📦 {product['title']}")
        print(f"   ID: {product['shopify_id']}")
        print(f"   Handle: {product['handle']}")
        print(f"   Vendor: {product['vendor']}")
        print(f"   Type: {product['product_type']}")
        print(f"   Variants: {product['variants_count']}")
        
        if product['matching_variants']:
            print("   Matching SKUs:")
            for variant in product['matching_variants']:
                match_info = f"({variant['match_type']} match"
                if variant['match_type'] == 'partial':
                    match_info += f" for {variant['target']}"
                match_info += ")"
                print(f"     - {variant['sku']}: ${variant['price']} (Stock: {variant['inventory']}) {match_info}")
        
        print()

if __name__ == "__main__":
    main()