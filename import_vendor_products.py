#!/usr/bin/env python3
"""
Import specific vendor products with SEO-optimized titles and separate color variants
"""
import requests
import json
import os
from datetime import datetime

SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"

# Target products with retail pricing
TARGET_PRODUCTS = {
    'M390SK': {'retail_price': 229.99, 'name': 'Shiny Satin U-Shape Vest'},
    'M301H': {'retail_price': 179.99, 'name': 'Hybrid Fit Business'},  
    'M341SK': {'retail_price': 229.99, 'name': 'Satin Shawl Collar'},
    'M392SK': {'retail_price': 229.99, 'name': 'Adjustable Shawl Collar'}
}

def fetch_products(access_token):
    """Fetch all products and filter for our targets"""
    base_url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json"
    headers = {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
    }
    
    all_products = []
    params = {'limit': 250}
    
    # Fetch multiple pages to ensure we get all products
    for page in range(1, 5):
        response = requests.get(base_url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            products = data.get('products', [])
            all_products.extend(products)
            
            # Check for next page
            if len(products) < 250:
                break
        else:
            print(f"Error fetching page {page}: {response.status_code}")
            break
    
    return all_products

def extract_target_products(all_products):
    """Extract only our target products with all details"""
    target_data = {}
    
    for product in all_products:
        # Check each variant to see if it matches our target SKUs
        for variant in product.get('variants', []):
            sku = variant.get('sku', '')
            base_sku = sku.split('-')[0] if '-' in sku else sku
            
            if base_sku in TARGET_PRODUCTS:
                if base_sku not in target_data:
                    target_data[base_sku] = {
                        'product_info': product,
                        'colors': {},
                        'images': product.get('images', [])
                    }
                
                # Extract color information
                color = variant.get('option1', 'Default')
                if color not in target_data[base_sku]['colors']:
                    target_data[base_sku]['colors'][color] = {
                        'variants': [],
                        'images': []
                    }
                
                target_data[base_sku]['colors'][color]['variants'].append({
                    'sku': sku,
                    'size': variant.get('option2', ''),
                    'shopify_price': variant.get('price'),
                    'inventory': variant.get('inventory_quantity', 0),
                    'barcode': variant.get('barcode', ''),
                    'weight': variant.get('weight', 1800),
                    'variant_id': variant.get('id')
                })
                
                # Try to find color-specific images
                if variant.get('image_id'):
                    for img in product.get('images', []):
                        if img.get('id') == variant.get('image_id'):
                            target_data[base_sku]['colors'][color]['images'].append(img.get('src'))
    
    return target_data

def create_seo_title(base_sku, color, product_type):
    """Create SEO-optimized product titles"""
    color_keywords = {
        'Black': 'Classic Black',
        'Navy': 'Navy Blue', 
        'Gray': 'Charcoal Gray',
        'Grey': 'Charcoal Grey',
        'Blue': 'Royal Blue',
        'Sky Blue': 'Sky Blue',
        'Rose': 'Dusty Rose',
        'Burgundy': 'Burgundy Wine',
        'White': 'Crisp White',
        'Ivory': 'Ivory Cream',
        'Silver': 'Silver',
        'Gold': 'Gold',
        'Red': 'Bold Red',
        'Green': 'Emerald Green',
        'Purple': 'Deep Purple',
        'Lavender': 'Lavender',
        'Mint': 'Mint Green',
        'Pink': 'Blush Pink'
    }
    
    # Get enhanced color name
    enhanced_color = color_keywords.get(color, color)
    
    # Build SEO title based on product type
    if base_sku == 'M390SK':
        title = f"Men's {enhanced_color} Shiny Satin U-Shape Vest 3-Piece Suit - Modern Fit Wedding Formal Wear"
    elif base_sku == 'M301H':
        title = f"Men's {enhanced_color} 2-Button Hybrid Fit Business Suit - Professional Office Attire"
    elif base_sku == 'M341SK':
        title = f"Men's {enhanced_color} Satin Shawl Collar Tuxedo Suit - Luxury Wedding & Prom"
    elif base_sku == 'M392SK':
        title = f"Men's {enhanced_color} Adjustable Shawl Collar Formal Suit - Premium Evening Wear"
    else:
        title = f"Men's {enhanced_color} {product_type} Suit - Formal Professional Attire"
    
    return title

def create_product_description(base_sku, color):
    """Create detailed product descriptions"""
    descriptions = {
        'M390SK': f"""
Elevate your formal wardrobe with this stunning {color} shiny satin suit featuring a distinctive U-shape vest. 
This modern 3-piece ensemble combines contemporary style with classic sophistication, perfect for weddings, 
prom nights, and special occasions.

Key Features:
• Premium shiny satin fabric with luxurious sheen
• Unique U-shape vest design for added style
• Modern slim fit silhouette
• Complete 3-piece set (jacket, pants, vest)
• Available in sizes 34R to 56L
• Perfect for weddings, proms, and formal events

Make a lasting impression at your next formal event with this eye-catching {color} suit that 
combines comfort, style, and sophistication.
""",
        'M301H': f"""
Experience the perfect blend of comfort and style with our {color} Hybrid Fit Business Suit. 
Designed for the modern professional, this 2-button suit offers a tailored look without 
sacrificing comfort throughout your busy day.

Key Features:
• Innovative hybrid fit - between slim and classic
• Premium wool-blend fabric
• 2-button single-breasted jacket
• Flat-front pants with extended tab
• Professional business appropriate
• Sizes available from 34R to 56L

Whether you're closing deals or attending important meetings, this {color} suit ensures 
you look sharp and feel confident all day long.
""",
        'M341SK': f"""
Make a statement with our luxurious {color} Satin Shawl Collar Tuxedo Suit. This sophisticated 
2-piece ensemble features elegant satin detailing that sets you apart at any formal occasion.

Key Features:
• Elegant satin shawl collar lapel
• Premium fabric with satin accents
• Single-breasted one-button closure
• Slim fit modern silhouette
• Perfect for weddings and black-tie events
• Available in sizes 34R to 56L

Turn heads at your next formal event with this impeccably styled {color} tuxedo suit that 
exudes confidence and sophistication.
""",
        'M392SK': f"""
Discover refined elegance with our {color} Adjustable Shawl Collar Formal Suit. This versatile 
suit features an innovative adjustable collar design that allows you to customize your look 
for any formal occasion.

Key Features:
• Unique adjustable shawl collar design
• Premium quality fabric construction
• Modern slim fit styling
• Single-button closure
• Satin trim detailing
• Sizes from 34R to 56L

Perfect for the fashion-forward gentleman who appreciates both style and versatility in 
their formal wardrobe. This {color} suit adapts to your style preferences while maintaining 
a sophisticated appearance.
"""
    }
    
    return descriptions.get(base_sku, f"Premium {color} formal suit perfect for special occasions.")

def generate_product_handle(base_sku, color):
    """Generate URL-friendly product handles"""
    color_slug = color.lower().replace(' ', '-').replace('/', '-')
    
    handles = {
        'M390SK': f"mens-{color_slug}-shiny-satin-vest-3-piece-suit",
        'M301H': f"mens-{color_slug}-hybrid-fit-business-suit",
        'M341SK': f"mens-{color_slug}-satin-shawl-collar-tuxedo",
        'M392SK': f"mens-{color_slug}-adjustable-shawl-collar-suit"
    }
    
    return handles.get(base_sku, f"mens-{color_slug}-formal-suit")

def main():
    print("🚀 Starting Vendor Product Import Process")
    print("=" * 70)
    
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')
    if not access_token:
        print("❌ No access token provided.")
        return
    
    print("📦 Target Products to Import:")
    for sku, info in TARGET_PRODUCTS.items():
        print(f"  • {sku}: {info['name']} - Retail ${info['retail_price']}")
    print()
    
    print("Fetching products from Shopify...")
    all_products = fetch_products(access_token)
    print(f"✅ Fetched {len(all_products)} total products")
    
    print("\nExtracting target products...")
    target_data = extract_target_products(all_products)
    
    if not target_data:
        print("❌ No target products found")
        return
    
    print(f"✅ Found {len(target_data)} target products")
    print()
    
    # Display found products with details
    total_variants = 0
    total_images = 0
    
    for base_sku, data in target_data.items():
        product_info = data['product_info']
        colors = data['colors']
        images = data['images']
        
        print(f"\n{'='*70}")
        print(f"📦 {base_sku}: {TARGET_PRODUCTS[base_sku]['name']}")
        print(f"   Original Title: {product_info.get('title')}")
        print(f"   Vendor: {product_info.get('vendor')}")
        print(f"   Total Images: {len(images)}")
        print(f"   Colors Available: {len(colors)}")
        print(f"   Retail Price: ${TARGET_PRODUCTS[base_sku]['retail_price']}")
        
        for color, color_data in colors.items():
            variants = color_data['variants']
            color_images = color_data['images']
            total_stock = sum(v['inventory'] for v in variants)
            
            print(f"\n   🎨 Color: {color}")
            print(f"      SEO Title: {create_seo_title(base_sku, color, TARGET_PRODUCTS[base_sku]['name'])}")
            print(f"      Handle: {generate_product_handle(base_sku, color)}")
            print(f"      Sizes: {len(variants)} ({', '.join([v['size'] for v in variants[:5]])}...)")
            print(f"      Total Stock: {total_stock} units")
            print(f"      Color Images: {len(color_images)}")
            
            total_variants += len(variants)
            total_images += len(color_images) if color_images else len(images)
    
    print(f"\n{'='*70}")
    print("📊 IMPORT SUMMARY:")
    print(f"  Total Products: {sum(len(d['colors']) for d in target_data.values())} (separated by color)")
    print(f"  Total Variants: {total_variants}")
    print(f"  Total Images: {total_images}")
    
    # Save data for SQL generation
    import_data = {
        'timestamp': datetime.now().isoformat(),
        'products': {}
    }
    
    for base_sku, data in target_data.items():
        import_data['products'][base_sku] = {
            'retail_price': TARGET_PRODUCTS[base_sku]['retail_price'],
            'colors': {}
        }
        
        for color, color_data in data['colors'].items():
            import_data['products'][base_sku]['colors'][color] = {
                'title': create_seo_title(base_sku, color, TARGET_PRODUCTS[base_sku]['name']),
                'handle': generate_product_handle(base_sku, color),
                'description': create_product_description(base_sku, color),
                'variants': color_data['variants'],
                'images': color_data['images'] if color_data['images'] else data['images'][:5],
                'vendor': data['product_info'].get('vendor', 'KCT Menswear'),
                'total_stock': sum(v['inventory'] for v in color_data['variants'])
            }
    
    # Save to JSON for SQL generation
    with open('vendor_import_data.json', 'w') as f:
        json.dump(import_data, f, indent=2)
    
    print(f"\n✅ Data saved to vendor_import_data.json")
    print("Ready to generate SQL import scripts!")

if __name__ == "__main__":
    main()