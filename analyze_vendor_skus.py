#!/usr/bin/env python3
"""
Analyze all vendor SKUs to find patterns similar to target SKUs
"""
import requests
import json
import os
import re

SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"

def fetch_all_products(access_token):
    """Fetch all products from Shopify"""
    base_url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json"
    headers = {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
    }
    
    all_products = []
    params = {'limit': 250}
    
    for page in range(1, 5):  # Get up to 1000 products
        print(f"Fetching page {page}...")
        response = requests.get(base_url, headers=headers, params={**params, 'page': page})
        
        if response.status_code != 200:
            break
            
        data = response.json()
        products = data.get('products', [])
        
        if not products:
            break
            
        all_products.extend(products)
    
    return all_products

def analyze_skus(products):
    """Analyze all SKUs in the catalog"""
    all_skus = []
    sku_patterns = {}
    
    # Collect all SKUs
    for product in products:
        for variant in product.get('variants', []):
            sku = variant.get('sku', '')
            if sku:
                all_skus.append({
                    'sku': sku,
                    'product': product.get('title'),
                    'price': variant.get('price'),
                    'inventory': variant.get('inventory_quantity', 0)
                })
                
                # Extract base pattern (everything before first dash)
                base = sku.split('-')[0] if '-' in sku else sku
                if base not in sku_patterns:
                    sku_patterns[base] = []
                sku_patterns[base].append(sku)
    
    return all_skus, sku_patterns

def find_similar_patterns(sku_patterns, targets):
    """Find SKU patterns similar to our targets"""
    similar = {}
    
    target_patterns = {
        'MJ': ['MJ425', 'MJ430', 'MJ428', 'MJ427', 'MJ426'],
        'SMJ': ['SMJ830', 'SMJ831', 'SMJ832', 'SMJ833'],
        'SM': ['SM164', 'SM179', 'SM197']
    }
    
    for prefix, target_bases in target_patterns.items():
        similar[prefix] = []
        
        for base_sku, examples in sku_patterns.items():
            # Check if this base SKU is similar to our targets
            if base_sku.startswith(prefix):
                # Check for numeric similarity
                for target in target_bases:
                    if len(base_sku) >= len(target[:5]):
                        similar[prefix].append({
                            'base': base_sku,
                            'examples': examples[:3],
                            'count': len(examples),
                            'target_similar': target
                        })
                        break
    
    return similar

def main():
    print("🔍 Analyzing vendor SKU patterns...")
    print()
    
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')
    if not access_token:
        print("❌ No access token provided.")
        return
    
    all_products = fetch_all_products(access_token)
    print(f"✅ Fetched {len(all_products)} products")
    print()
    
    all_skus, sku_patterns = analyze_skus(all_products)
    
    # Show all unique base SKU patterns that start with our target prefixes
    target_prefixes = ['MJ', 'SMJ', 'SM']
    
    print("📊 Base SKU patterns matching target prefixes:")
    print()
    
    for prefix in target_prefixes:
        matching_bases = [base for base in sku_patterns.keys() if base.startswith(prefix)]
        
        if matching_bases:
            print(f"🔹 {prefix}* patterns found: {len(matching_bases)}")
            
            # Sort by similarity to target numbers
            for base in sorted(matching_bases)[:20]:  # Show first 20
                count = len(sku_patterns[base])
                examples = sku_patterns[base][:2]
                
                # Find the product for this SKU
                product_title = "Unknown"
                for sku_info in all_skus:
                    if sku_info['sku'].startswith(base):
                        product_title = sku_info['product'][:40] + "..."
                        break
                
                print(f"   {base}: {count} variants | {product_title}")
                print(f"      Examples: {', '.join(examples)}")
        else:
            print(f"❌ No {prefix}* patterns found")
        print()
    
    # Check if any SKUs contain our target numbers
    print("🔍 Searching for SKUs containing target numbers...")
    target_numbers = ['425', '430', '428', '427', '426', '830', '831', '832', '833', '164', '179', '197']
    
    matches = []
    for sku_info in all_skus:
        sku = sku_info['sku']
        for num in target_numbers:
            if num in sku:
                matches.append({
                    'sku': sku,
                    'number': num,
                    'product': sku_info['product'],
                    'price': sku_info['price'],
                    'inventory': sku_info['inventory']
                })
                break
    
    if matches:
        print(f"✅ Found {len(matches)} SKUs containing target numbers:")
        for m in matches[:10]:  # Show first 10
            print(f"   {m['sku']}: {m['product'][:30]}... (contains '{m['number']}')")
            print(f"      ${m['price']} | Stock: {m['inventory']}")
    else:
        print("❌ No SKUs found containing target numbers")

if __name__ == "__main__":
    main()