#!/usr/bin/env python3
"""
Generate SQL import scripts for vendor products
"""
import json
import uuid
from datetime import datetime

def generate_product_id():
    """Generate a unique product ID"""
    return f"prod_{uuid.uuid4().hex[:16]}"

def generate_variant_id():
    """Generate a unique variant ID"""
    return f"var_{uuid.uuid4().hex[:16]}"

def generate_price_id():
    """Generate a unique price ID"""
    return f"price_{uuid.uuid4().hex[:16]}"

def generate_sql_for_product(base_sku, color, product_data):
    """Generate SQL for a single product with all its variants"""
    
    product_id = generate_product_id()
    handle = product_data['handle']
    title = product_data['title'].replace("'", "''")  # Escape quotes
    description = product_data['description'].replace("'", "''")
    retail_price = product_data['retail_price']
    vendor = product_data['vendor'].replace("'", "''")  # Escape quotes
    images = product_data['images']
    variants = product_data['variants']
    
    # Escape quotes in color name
    color_escaped = color.replace("'", "''")
    
    # Start SQL script  
    sql = f"""
-- ============================================
-- Product: {title.replace("''", "'")}
-- SKU Base: {base_sku} | Color: {color}
-- Total Variants: {len(variants)} | Stock: {product_data['total_stock']}
-- ============================================

-- Insert base product
INSERT INTO product (
    id, handle, title, subtitle, description, 
    status, thumbnail, metadata, created_at, updated_at
) VALUES (
    '{product_id}',
    '{handle}',
    '{title}',
    '{base_sku} - {color_escaped}',
    '{description}',
    'published',
    '{images[0] if images else 'https://placehold.co/600x800?text=' + color.replace(' ', '+')}',
    '{{"vendor": "{vendor}", "base_sku": "{base_sku}", "color": "{color_escaped}", "source": "shopify_vendor", "import_date": "{datetime.now().isoformat()}"}}',
    NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add product to store
INSERT INTO product_sales_channel (product_id, sales_channel_id)
SELECT '{product_id}', store.id
FROM store
WHERE store.name = 'KCT Store'
ON CONFLICT DO NOTHING;

-- Add product tags for SEO
INSERT INTO product_tags (product_id, value)
VALUES 
    ('{product_id}', '{color.lower()}'),
    ('{product_id}', 'suit'),
    ('{product_id}', 'formal wear'),
    ('{product_id}', 'wedding'),
    ('{product_id}', 'prom'),
    ('{product_id}', '{vendor.lower()}'),
    ('{product_id}', '{base_sku.lower()}')
ON CONFLICT DO NOTHING;

-- Create product variants
DO $$
DECLARE
    v_variant_id TEXT;
    v_price_id TEXT;
    v_variant RECORD;
    v_counter INT := 0;
BEGIN
    FOR v_variant IN 
        SELECT * FROM (VALUES
"""
    
    # Add variant data
    for i, variant in enumerate(variants):
        sku = variant['sku']
        size = variant['size']
        stock = variant['inventory']
        weight = variant.get('weight', 1800)
        barcode = variant.get('barcode', '')
        
        # Clean size for display
        size_display = size.replace('/28W', '').replace('/30W', '').replace('/32W', '').replace('/34W', '').replace('/36W', '').replace('/38W', '')
        
        sql += f"        ('{sku}', '{size_display}', {stock}, {weight}, '{barcode}')"
        if i < len(variants) - 1:
            sql += ","
        sql += "\n"
    
    sql += """    ) AS t(sku, size, stock, weight, barcode)
    LOOP
        v_variant_id := 'var_' || substr(gen_random_uuid()::text, 1, 16);
        v_price_id := gen_random_uuid()::text;
        v_counter := v_counter + 1;
        
        -- Insert variant
        INSERT INTO product_variant (
            id, product_id, title, sku, barcode,
            manage_inventory, allow_backorder, 
            weight, metadata, created_at, updated_at
        ) VALUES (
            v_variant_id,
            '""" + product_id + """',
            v_variant.size,
            v_variant.sku,
            v_variant.barcode,
            false,  -- Don't manage inventory
            true,   -- Allow backorder
            v_variant.weight,
            jsonb_build_object(
                'size', v_variant.size,
                'color', '""" + color_escaped + """',
                'shopify_stock', v_variant.stock
            ),
            NOW(), NOW()
        );
        
        -- Create price for variant
        INSERT INTO price_set (id) VALUES (v_price_id);
        
        -- Link variant to price set
        INSERT INTO product_variant_price_set (variant_id, price_set_id)
        VALUES (v_variant_id, v_price_id);
        
        -- Add actual price
        INSERT INTO price (
            id, currency_code, amount, price_set_id,
            min_quantity, max_quantity, created_at, updated_at
        ) VALUES (
            'price_' || substr(gen_random_uuid()::text, 1, 16),
            'usd',
            """ + str(int(retail_price * 100)) + """,  -- Convert to cents
            v_price_id,
            1, null,
            NOW(), NOW()
        );
        
    END LOOP;
    
    RAISE NOTICE 'Created % variants for product', v_counter;
END $$;

-- Add product images
"""
    
    # Add images
    for i, image_url in enumerate(images[:5]):  # Limit to 5 images
        sql += f"""
INSERT INTO product_image (
    id, product_id, url, rank, metadata, created_at, updated_at
) VALUES (
    'img_{uuid.uuid4().hex[:16]}',
    '{product_id}',
    '{image_url}',
    {i},
    '{{"color": "{color_escaped}"}}',
    NOW(), NOW()
) ON CONFLICT DO NOTHING;
"""
    
    sql += f"""
-- Add to US region pricing
INSERT INTO product_variant_price_set pvps
SELECT 
    pv.id as variant_id,
    ps.id as price_set_id
FROM product_variant pv
CROSS JOIN (SELECT gen_random_uuid()::text as id) ps
WHERE pv.product_id = '{product_id}'
ON CONFLICT DO NOTHING;

COMMIT;
"""
    
    return sql

def main():
    print("📝 Generating SQL Import Scripts")
    print("=" * 70)
    
    # Load the vendor data
    with open('vendor_import_data.json', 'r') as f:
        import_data = json.load(f)
    
    # Process each product
    all_sql = """-- ============================================
-- VENDOR PRODUCT IMPORT SQL
-- Generated: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """
-- Products: M390SK, M301H, M341SK, M392SK
-- ============================================

BEGIN;

"""
    
    product_count = 0
    variant_count = 0
    
    # Define retail prices
    retail_prices = {
        'M390SK': 229.99,
        'M301H': 179.99,
        'M341SK': 229.99,
        'M392SK': 229.99
    }
    
    for base_sku, sku_data in import_data['products'].items():
        print(f"\n📦 Processing {base_sku}:")
        
        for color, color_data in sku_data['colors'].items():
            # Skip colors with no stock (optional - remove this if you want all colors)
            if color_data['total_stock'] == 0 and base_sku == 'M301H':
                print(f"   ⚠️ Skipping {color} (no stock)")
                continue
            
            print(f"   🎨 {color}: {len(color_data['variants'])} variants, {color_data['total_stock']} stock")
            
            # Prepare product data
            product_data = {
                'handle': color_data['handle'],
                'title': color_data['title'],
                'description': color_data['description'],
                'retail_price': retail_prices[base_sku],
                'vendor': color_data['vendor'],
                'images': color_data['images'],
                'variants': color_data['variants'],
                'total_stock': color_data['total_stock']
            }
            
            # Generate SQL for this product
            product_sql = generate_sql_for_product(base_sku, color, product_data)
            all_sql += product_sql + "\n\n"
            
            product_count += 1
            variant_count += len(color_data['variants'])
    
    # Add final commit
    all_sql += """
-- ============================================
-- IMPORT COMPLETE
-- Products Created: """ + str(product_count) + """
-- Variants Created: """ + str(variant_count) + """
-- ============================================

COMMIT;

-- Verify import
SELECT 
    p.handle,
    p.title,
    COUNT(DISTINCT pv.id) as variant_count,
    MIN(pr.amount)/100.0 as price,
    p.metadata->>'color' as color,
    p.metadata->>'base_sku' as base_sku
FROM product p
LEFT JOIN product_variant pv ON pv.product_id = p.id
LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
LEFT JOIN price pr ON pr.price_set_id = pvps.price_set_id
WHERE p.metadata->>'source' = 'shopify_vendor'
GROUP BY p.id, p.handle, p.title, p.metadata
ORDER BY p.metadata->>'base_sku', p.metadata->>'color';
"""
    
    # Save SQL file
    filename = f"import_vendor_products_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    with open(filename, 'w') as f:
        f.write(all_sql)
    
    print(f"\n✅ SQL script generated: {filename}")
    print(f"📊 Summary:")
    print(f"   • Products: {product_count}")
    print(f"   • Variants: {variant_count}")
    print(f"   • Average variants per product: {variant_count // product_count if product_count > 0 else 0}")
    
    return filename

if __name__ == "__main__":
    filename = main()