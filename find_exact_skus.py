#!/usr/bin/env python3
"""
Find exact SKUs understanding the pattern:
Base SKU (e.g., MJ428S) + Color Code (e.g., -01) + Size (e.g., -34R)
"""
import requests
import json
import os

SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"

# Target base SKUs from suitsamerica.com
target_base_skus = [
    "MJ425S", "MJ430S", "MJ428S", "MJ427S", "MJ426S",
    "SMJ830H1", "SMJ831H1", "SMJ832H1", "SMJ833H1", 
    "SM164H1", "SM179H1", "SM197H1"
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
            print(f"Fetching page {page}...", end=" ")
            
            if next_link:
                response = requests.get(next_link, headers=headers)
            else:
                params = {'limit': 250}
                response = requests.get(base_url, headers=headers, params=params)
            
            if response.status_code != 200:
                print(f"❌ API Error: {response.status_code}")
                break
                
            data = response.json()
            products = data.get('products', [])
            
            if not products:
                break
                
            all_products.extend(products)
            print(f"✓ ({len(all_products)} total)")
            
            # Check for pagination link in headers
            link_header = response.headers.get('Link', '')
            next_link = None
            
            if 'rel="next"' in link_header:
                for link in link_header.split(','):
                    if 'rel="next"' in link:
                        next_link = link.split('<')[1].split('>')[0]
                        break
            
            if not next_link:
                break
                
            page += 1
            
            if page > 20:
                break
        
        return all_products
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def find_matching_products(products, target_base_skus):
    """Find products matching our target base SKUs"""
    matches = {}
    
    for product in products:
        for variant in product.get('variants', []):
            variant_sku = variant.get('sku', '')
            
            # Check if variant SKU starts with any of our target base SKUs
            for base_sku in target_base_skus:
                if variant_sku.startswith(base_sku + '-') or variant_sku == base_sku:
                    # Found a match!
                    if base_sku not in matches:
                        matches[base_sku] = {
                            'product': product,
                            'variants': []
                        }
                    
                    # Parse the variant details
                    sku_parts = variant_sku.split('-')
                    color_code = sku_parts[1] if len(sku_parts) > 1 else 'N/A'
                    size_code = sku_parts[2] if len(sku_parts) > 2 else 'N/A'
                    
                    matches[base_sku]['variants'].append({
                        'full_sku': variant_sku,
                        'color_code': color_code,
                        'size': size_code,
                        'title': variant.get('title', ''),
                        'price': variant.get('price'),
                        'compare_price': variant.get('compare_at_price'),
                        'inventory': variant.get('inventory_quantity', 0),
                        'variant_id': variant.get('id')
                    })
    
    return matches

def analyze_color_codes(matches):
    """Analyze color codes across all matches"""
    color_codes = {}
    
    for base_sku, data in matches.items():
        for variant in data['variants']:
            code = variant['color_code']
            if code != 'N/A':
                if code not in color_codes:
                    color_codes[code] = set()
                # Try to infer color from variant title
                title = variant['title'].lower()
                if 'black' in title:
                    color_codes[code].add('Black')
                elif 'navy' in title:
                    color_codes[code].add('Navy')
                elif 'gray' in title or 'grey' in title:
                    color_codes[code].add('Gray')
                elif 'white' in title:
                    color_codes[code].add('White')
                elif 'blue' in title:
                    color_codes[code].add('Blue')
                elif 'burgundy' in title or 'wine' in title:
                    color_codes[code].add('Burgundy')
                elif 'brown' in title or 'tan' in title:
                    color_codes[code].add('Brown/Tan')
                elif 'silver' in title:
                    color_codes[code].add('Silver')
                elif 'gold' in title:
                    color_codes[code].add('Gold')
    
    return color_codes

def main():
    print("🔍 Searching for exact SKUs with proper pattern understanding...")
    print(f"Target base SKUs: {', '.join(target_base_skus)}")
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
    
    # Find matching products
    matches = find_matching_products(all_products, target_base_skus)
    
    if not matches:
        print("❌ No matches found for target base SKUs")
        return
    
    print(f"✅ Found {len(matches)} matching base SKUs with products!")
    print("=" * 70)
    print()
    
    # Analyze color codes
    color_codes = analyze_color_codes(matches)
    
    if color_codes:
        print("📊 Color Code Analysis:")
        for code, colors in sorted(color_codes.items()):
            color_str = ', '.join(colors) if colors else 'Unknown'
            print(f"  -{code} = {color_str}")
        print()
        print("=" * 70)
        print()
    
    # Display detailed matches
    for base_sku in target_base_skus:
        if base_sku in matches:
            data = matches[base_sku]
            product = data['product']
            
            print(f"✅ FOUND: {base_sku}")
            print(f"📦 Product: {product.get('title')}")
            print(f"   Shopify ID: {product.get('id')}")
            print(f"   Handle: {product.get('handle')}")
            print(f"   Vendor: {product.get('vendor', 'N/A')}")
            print(f"   Type: {product.get('product_type', 'N/A')}")
            print(f"   Total Variants: {len(data['variants'])}")
            
            # Group variants by color
            by_color = {}
            for v in data['variants']:
                color = v['color_code']
                if color not in by_color:
                    by_color[color] = []
                by_color[color].append(v)
            
            print(f"   Available Colors: {len(by_color)}")
            
            for color_code, variants in sorted(by_color.items()):
                sizes_in_stock = [v['size'] for v in variants if v['inventory'] > 0]
                total_stock = sum(v['inventory'] for v in variants)
                price = variants[0]['price']
                
                print(f"     Color -{color_code}: ${price} | {len(variants)} sizes | {total_stock} total stock")
                if sizes_in_stock:
                    print(f"       In Stock: {', '.join(sizes_in_stock)}")
            
            print()
        else:
            print(f"❌ NOT FOUND: {base_sku}")
            print()
    
    # Summary
    print("=" * 70)
    print("📋 SUMMARY:")
    found = [sku for sku in target_base_skus if sku in matches]
    not_found = [sku for sku in target_base_skus if sku not in matches]
    
    print(f"✅ Found {len(found)} SKUs: {', '.join(found)}")
    if not_found:
        print(f"❌ Not found {len(not_found)} SKUs: {', '.join(not_found)}")
    
    total_products = len(matches)
    total_variants = sum(len(m['variants']) for m in matches.values())
    total_stock = sum(v['inventory'] for m in matches.values() for v in m['variants'])
    
    print(f"\n📊 Totals:")
    print(f"   Products: {total_products}")
    print(f"   Variants: {total_variants}")
    print(f"   Total Stock: {total_stock} units")

if __name__ == "__main__":
    main()