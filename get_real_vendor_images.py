#!/usr/bin/env python3
"""
Get actual image URLs from Shopify vendor for our products
"""
import requests
import json
import os

SHOPIFY_DOMAIN = "suits-inventory.myshopify.com"
TARGET_SKUS = ['M390SK', 'M301H', 'M341SK', 'M392SK']

def get_product_images(access_token):
    """Fetch actual product images from Shopify"""
    base_url = f"https://{SHOPIFY_DOMAIN}/admin/api/2024-01/products.json"
    headers = {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
    }
    
    all_products = []
    params = {'limit': 250}
    
    # Fetch products
    for page in range(1, 5):
        response = requests.get(base_url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            products = data.get('products', [])
            all_products.extend(products)
            if len(products) < 250:
                break
        else:
            break
    
    # Find our target products and extract real image URLs
    image_mapping = {}
    
    for product in all_products:
        # Check if this is one of our target products
        for variant in product.get('variants', []):
            sku = variant.get('sku', '')
            base_sku = sku.split('-')[0] if '-' in sku else sku
            
            if base_sku in TARGET_SKUS:
                if base_sku not in image_mapping:
                    image_mapping[base_sku] = {
                        'title': product.get('title'),
                        'images': [],
                        'colors': {}
                    }
                
                # Get all product images
                for img in product.get('images', []):
                    img_url = img.get('src', '')
                    if img_url and img_url not in image_mapping[base_sku]['images']:
                        image_mapping[base_sku]['images'].append(img_url)
                
                # Try to map images to colors
                color = variant.get('option1', 'Default')
                if color not in image_mapping[base_sku]['colors']:
                    image_mapping[base_sku]['colors'][color] = []
                
                # Check if variant has specific image
                if variant.get('image_id'):
                    for img in product.get('images', []):
                        if img.get('id') == variant.get('image_id'):
                            if img.get('src') not in image_mapping[base_sku]['colors'][color]:
                                image_mapping[base_sku]['colors'][color].append(img.get('src'))
                break
    
    return image_mapping

def generate_update_sql(image_mapping):
    """Generate SQL to update product images with real URLs"""
    sql = """-- Update vendor products with actual Shopify image URLs
BEGIN;

"""
    
    for base_sku, data in image_mapping.items():
        if data['images']:
            # Use first image as default
            default_image = data['images'][0]
            
            sql += f"""
-- Update {base_sku} products with real images
UPDATE product 
SET thumbnail = '{default_image}'
WHERE metadata->>'base_sku' = '{base_sku}'
AND metadata->>'source' = 'shopify_vendor';
"""
            
            # Add color-specific images if available
            for color, color_images in data['colors'].items():
                if color_images:
                    # Escape single quotes in color name
                    color_escaped = color.replace("'", "''")
                    sql += f"""
-- Update {base_sku} {color} variant
UPDATE product 
SET thumbnail = '{color_images[0]}'
WHERE metadata->>'base_sku' = '{base_sku}'
AND metadata->>'color' = '{color_escaped}'
AND metadata->>'source' = 'shopify_vendor';
"""
    
    sql += """
COMMIT;

-- Verify updates
SELECT 
    handle,
    metadata->>'base_sku' as sku,
    metadata->>'color' as color,
    thumbnail
FROM product 
WHERE metadata->>'source' = 'shopify_vendor'
ORDER BY metadata->>'base_sku', metadata->>'color';
"""
    
    return sql

def main():
    print("🔍 Fetching actual vendor product images...")
    
    access_token = os.getenv('SHOPIFY_ACCESS_TOKEN')
    if not access_token:
        print("❌ No access token provided.")
        return
    
    image_mapping = get_product_images(access_token)
    
    if not image_mapping:
        print("❌ No images found for target products")
        return
    
    print(f"✅ Found images for {len(image_mapping)} products")
    print()
    
    # Display found images
    for base_sku, data in image_mapping.items():
        print(f"📦 {base_sku}: {data['title']}")
        print(f"   Total images: {len(data['images'])}")
        if data['images']:
            print(f"   Primary image: {data['images'][0][:80]}...")
        print(f"   Colors with images: {len(data['colors'])}")
        for color, imgs in list(data['colors'].items())[:3]:
            if imgs:
                print(f"     • {color}: {len(imgs)} images")
        print()
    
    # Generate SQL
    sql = generate_update_sql(image_mapping)
    
    # Save SQL file
    with open('update_vendor_images_real.sql', 'w') as f:
        f.write(sql)
    
    print("✅ SQL script saved to update_vendor_images_real.sql")
    print("Run: PGPASSWORD=MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds psql -h centerbeam.proxy.rlwy.net -p 20197 -U postgres -d railway -f update_vendor_images_real.sql")

if __name__ == "__main__":
    main()