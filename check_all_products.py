#!/usr/bin/env python3
"""
Fetch ALL products from Shopify vendor to get complete picture
"""
import requests
import json
import os

SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"
target_skus = [
    "MJ425S", "SMJ830H1", "MJ430S", "MJ428S", "MJ427S", "MJ426S",
    "SMJ831H1", "SMJ832H1", "SMJ833H1", "SM164H1", "SM179H1", "SM197H1"
]

def fetch_all_products(access_token):
    """Fetch all products from Shopify using pagination"""
    base_url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json"
    headers = {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
    }
    
    all_products = []
    next_link = None
    page = 1
    
    try:
        while True:
            print(f"Fetching page {page}...")
            
            if next_link:
                response = requests.get(next_link, headers=headers)
            else:
                params = {'limit': 250}
                response = requests.get(base_url, headers=headers, params=params)
            
            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                break
                
            data = response.json()
            products = data.get('products', [])
            
            if not products:
                break
                
            all_products.extend(products)
            print(f"   Got {len(products)} products (total: {len(all_products)})")
            
            # Check for pagination link in headers
            link_header = response.headers.get('Link', '')
            next_link = None
            
            if 'rel="next"' in link_header:
                # Extract next URL from Link header
                for link in link_header.split(','):
                    if 'rel="next"' in link:
                        next_link = link.split('<')[1].split('>')[0]
                        break
            
            if not next_link:
                break
                
            page += 1
            
            # Safety break to avoid infinite loops
            if page > 20:  # Max 5000 products
                print("⚠️ Stopping at page 20 for safety")
                break
        
        return all_products
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def analyze_sku_patterns(products):
    """Analyze SKU patterns to understand naming conventions"""
    sku_patterns = {}
    sku_prefixes = {}
    
    for product in products:
        for variant in product.get('variants', []):
            sku = variant.get('sku', '')
            if sku:
                # Count SKU patterns
                if '-' in sku:
                    parts = sku.split('-')
                    pattern = f"{parts[0]}-XX-XX"
                    if pattern not in sku_patterns:
                        sku_patterns[pattern] = []
                    sku_patterns[pattern].append(sku)
                
                # Count prefixes
                if len(sku) > 2:
                    prefix = sku[:3]
                    sku_prefixes[prefix] = sku_prefixes.get(prefix, 0) + 1
    
    return sku_patterns, sku_prefixes

def main():
    print("🔍 Fetching ALL products from Shopify vendor catalog...")
    print()
    
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')
    if not access_token:
        print("❌ No access token provided.")
        return
    
    all_products = fetch_all_products(access_token)
    
    if not all_products:
        print("❌ No products fetched")
        return
    
    print(f"✅ Total products fetched: {len(all_products)}")
    print()
    
    # Analyze SKU patterns
    sku_patterns, sku_prefixes = analyze_sku_patterns(all_products)
    
    print("📊 SKU Pattern Analysis:")
    print("Top 10 SKU patterns:")
    for pattern, examples in list(sku_patterns.items())[:10]:
        print(f"  {pattern}: {len(examples)} variants (e.g., {examples[0]})")
    
    print()
    print("Top 10 SKU prefixes:")
    for prefix, count in sorted(sku_prefixes.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {prefix}*: {count} variants")
    
    print()
    
    # Search for target SKUs in all products
    found_matches = []
    for product in all_products:
        for variant in product.get('variants', []):
            variant_sku = variant.get('sku', '').upper()
            
            # Exact match
            if variant_sku in target_skus:
                found_matches.append({
                    'product_title': product.get('title'),
                    'sku': variant_sku,
                    'match_type': 'exact',
                    'price': variant.get('price'),
                    'inventory': variant.get('inventory_quantity', 0),
                    'shopify_id': product.get('id')
                })
            
            # Partial matches
            for target_sku in target_skus:
                if target_sku in variant_sku or variant_sku in target_sku:
                    found_matches.append({
                        'product_title': product.get('title'),
                        'sku': variant_sku,
                        'target': target_sku,
                        'match_type': 'contains',
                        'price': variant.get('price'),
                        'inventory': variant.get('inventory_quantity', 0),
                        'shopify_id': product.get('id')
                    })
    
    if found_matches:
        print(f"✅ Found {len(found_matches)} SKU matches:")
        for match in found_matches:
            print(f"  📦 {match['product_title'][:40]}...")
            print(f"     SKU: {match['sku']} | ${match['price']} | Stock: {match['inventory']}")
            if match['match_type'] == 'contains':
                print(f"     (Partial match for: {match['target']})")
            print()
    else:
        print("❌ No matches found for target SKUs in entire catalog")
        print("   The target SKUs from suitsamerica.com are not in this vendor's catalog")
        print("   This suggests they are different suppliers/manufacturers")

if __name__ == "__main__":
    main()