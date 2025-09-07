#!/usr/bin/env python3
"""
Analyze current vendor catalog to identify best products for import
"""
import requests
import json
import os

SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"

def fetch_all_products(access_token):
    """Fetch all products from Shopify with pagination"""
    base_url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json"
    headers = {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
    }
    
    all_products = []
    params = {'limit': 250}
    page_info = None
    
    while True:
        if page_info:
            response = requests.get(base_url, headers=headers, params={'page_info': page_info, 'limit': 250})
        else:
            response = requests.get(base_url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            break
            
        data = response.json()
        products = data.get('products', [])
        
        if not products:
            break
            
        all_products.extend(products)
        
        # Check for next page
        link_header = response.headers.get('Link', '')
        if 'rel="next"' in link_header:
            # Extract page_info from link header
            for link in link_header.split(','):
                if 'rel="next"' in link:
                    import re
                    match = re.search(r'page_info=([^&>]+)', link)
                    if match:
                        page_info = match.group(1)
                        break
            else:
                break
        else:
            break
    
    return all_products

def analyze_catalog(products):
    """Analyze the vendor catalog"""
    analysis = {
        'total_products': len(products),
        'categories': {},
        'vendors': {},
        'price_tiers': {
            'under_150': [],
            '150_to_200': [],
            '200_to_250': [],
            'over_250': []
        },
        'high_stock': [],
        'zero_stock': []
    }
    
    for product in products:
        # Categorize by type
        product_type = product.get('product_type', 'Unknown')
        if product_type not in analysis['categories']:
            analysis['categories'][product_type] = []
        
        # Track vendor
        vendor = product.get('vendor', 'Unknown')
        if vendor not in analysis['vendors']:
            analysis['vendors'][vendor] = 0
        analysis['vendors'][vendor] += 1
        
        # Calculate stock and pricing
        total_stock = 0
        prices = []
        variants_data = []
        
        for variant in product.get('variants', []):
            stock = variant.get('inventory_quantity', 0)
            total_stock += stock
            price = float(variant.get('price', 0))
            if price > 0:
                prices.append(price)
            
            variants_data.append({
                'sku': variant.get('sku', ''),
                'stock': stock,
                'price': price,
                'size': variant.get('option2', ''),
                'color': variant.get('option1', '')
            })
        
        if prices:
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            
            product_info = {
                'id': product.get('id'),
                'title': product.get('title'),
                'vendor': vendor,
                'type': product_type,
                'total_stock': total_stock,
                'avg_price': avg_price,
                'min_price': min_price,
                'variants_count': len(variants_data),
                'sku_base': variants_data[0]['sku'].split('-')[0] if variants_data else 'N/A'
            }
            
            # Add to category
            analysis['categories'][product_type].append(product_info)
            
            # Price tier classification
            if min_price < 150:
                analysis['price_tiers']['under_150'].append(product_info)
            elif min_price < 200:
                analysis['price_tiers']['150_to_200'].append(product_info)
            elif min_price < 250:
                analysis['price_tiers']['200_to_250'].append(product_info)
            else:
                analysis['price_tiers']['over_250'].append(product_info)
            
            # Track high stock products
            if total_stock > 20:
                analysis['high_stock'].append(product_info)
            elif total_stock == 0:
                analysis['zero_stock'].append(product_info)
    
    return analysis

def calculate_import_value(product_info):
    """Calculate import priority score for a product"""
    score = 0
    
    # Stock availability (high weight)
    if product_info['total_stock'] > 50:
        score += 30
    elif product_info['total_stock'] > 20:
        score += 20
    elif product_info['total_stock'] > 10:
        score += 10
    elif product_info['total_stock'] > 0:
        score += 5
    
    # Price point (profit potential)
    if 150 <= product_info['min_price'] < 200:
        score += 25  # Sweet spot for markup
    elif 200 <= product_info['min_price'] < 250:
        score += 20
    elif product_info['min_price'] < 150:
        score += 15
    else:
        score += 10
    
    # Variant count (size options)
    if product_info['variants_count'] > 20:
        score += 15
    elif product_info['variants_count'] > 10:
        score += 10
    elif product_info['variants_count'] > 5:
        score += 5
    
    # Vendor reputation
    if product_info['vendor'] in ['Tazzio', 'Perry Ellis', 'Giorgio Inserti']:
        score += 10
    
    return score

def main():
    print("🔍 Analyzing Current Vendor Catalog...")
    print("=" * 70)
    
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')
    if not access_token:
        print("❌ No access token provided.")
        return
    
    print("Fetching all products...")
    all_products = fetch_all_products(access_token)
    
    if not all_products:
        print("❌ No products fetched")
        return
    
    print(f"✅ Fetched {len(all_products)} products")
    print()
    
    # Analyze catalog
    analysis = analyze_catalog(all_products)
    
    # Display analysis
    print("📊 CATALOG OVERVIEW")
    print("-" * 70)
    print(f"Total Products: {analysis['total_products']}")
    print(f"Zero Stock Products: {len(analysis['zero_stock'])}")
    print(f"High Stock Products (>20 units): {len(analysis['high_stock'])}")
    print()
    
    print("📦 PRODUCT CATEGORIES")
    print("-" * 70)
    for category, products in analysis['categories'].items():
        if products:
            total_stock = sum(p['total_stock'] for p in products)
            avg_price = sum(p['avg_price'] for p in products) / len(products)
            print(f"{category}: {len(products)} products | {total_stock} total units | ${avg_price:.2f} avg")
    print()
    
    print("💰 PRICE DISTRIBUTION")
    print("-" * 70)
    for tier, products in analysis['price_tiers'].items():
        print(f"{tier.replace('_', ' ').title()}: {len(products)} products")
    print()
    
    print("🏢 VENDOR BREAKDOWN")
    print("-" * 70)
    for vendor, count in sorted(analysis['vendors'].items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"{vendor}: {count} products")
    print()
    
    # Calculate import priorities
    print("🎯 TOP 20 PRODUCTS TO IMPORT (by priority score)")
    print("-" * 70)
    
    all_products_with_scores = []
    for category_products in analysis['categories'].values():
        for product in category_products:
            product['import_score'] = calculate_import_value(product)
            all_products_with_scores.append(product)
    
    # Sort by import score
    top_products = sorted(all_products_with_scores, key=lambda x: x['import_score'], reverse=True)[:20]
    
    for i, product in enumerate(top_products, 1):
        print(f"{i}. {product['sku_base']}: {product['title'][:40]}...")
        print(f"   Score: {product['import_score']} | Stock: {product['total_stock']} | Price: ${product['min_price']:.2f}")
        print(f"   Vendor: {product['vendor']} | Type: {product['type']}")
        print()
    
    # Recommended import tiers
    print("📋 RECOMMENDED IMPORT STRATEGY")
    print("-" * 70)
    print("Tier 1 - Immediate Import (High Stock, Good Margin):")
    tier1 = [p for p in top_products[:10] if p['total_stock'] > 10]
    for p in tier1[:5]:
        print(f"  • {p['sku_base']}: {p['title'][:30]}... (Stock: {p['total_stock']}, ${p['min_price']:.2f})")
    
    print("\nTier 2 - Secondary Import (Good Products, Lower Stock):")
    tier2 = [p for p in top_products[10:20] if p['total_stock'] > 0]
    for p in tier2[:5]:
        print(f"  • {p['sku_base']}: {p['title'][:30]}... (Stock: {p['total_stock']}, ${p['min_price']:.2f})")

if __name__ == "__main__":
    main()