#!/usr/bin/env python3
"""
SUPABASE TO MEDUSA MIGRATION SCRIPT
Migrates 178 products from Supabase to Medusa 2.0
"""

import psycopg2
from psycopg2.extras import Json
import json
import uuid
from datetime import datetime

# Configuration
SUPABASE_CONFIG = {
    'host': 'YOUR_SUPABASE_HOST.supabase.co',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'YOUR_SUPABASE_PASSWORD',
    'port': 5432
}

MEDUSA_CONFIG = {
    'host': 'centerbeam.proxy.rlwy.net',
    'database': 'railway',
    'user': 'postgres',
    'password': 'MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds',
    'port': 20197
}

# Size configurations for menswear
SIZES = {
    'regular': [f"{i}R" for i in range(34, 57, 2)],  # 34R-56R
    'short': [f"{i}S" for i in range(34, 47, 2)],    # 34S-46S
    'long': [f"{i}L" for i in range(38, 57, 2)]      # 38L-56L
}

def generate_id(prefix):
    """Generate Medusa-compatible ID"""
    return f"{prefix}_{str(uuid.uuid4())[:16]}"

def create_handle(title):
    """Create URL-friendly handle from title"""
    if not title:
        return generate_id('product')
    return title.lower().replace(' ', '-').replace('/', '-').replace('&', 'and')

def migrate_products():
    """Main migration function"""
    print("🚀 Starting Supabase to Medusa migration...")
    
    # Connect to both databases
    print("\n📊 Connecting to databases...")
    supabase_conn = psycopg2.connect(**SUPABASE_CONFIG)
    medusa_conn = psycopg2.connect(**MEDUSA_CONFIG)
    
    supabase_cur = supabase_conn.cursor()
    medusa_cur = medusa_conn.cursor()
    
    try:
        # 1. Fetch products from Supabase
        print("\n📥 Fetching products from Supabase...")
        supabase_cur.execute("""
            SELECT 
                id, title, name, handle, description, sku, style_code,
                vendor, category, type, color, price, compare_at_price,
                image_url, images, sizes, tags, status, inventory,
                created_at, updated_at
            FROM products
            WHERE status = 'active' OR status IS NULL
            ORDER BY created_at DESC
        """)
        
        products = supabase_cur.fetchall()
        print(f"✅ Found {len(products)} products in Supabase")
        
        success_count = 0
        error_count = 0
        
        # 2. Process each product
        for product in products:
            try:
                (sup_id, title, name, handle, description, sku, style_code,
                 vendor, category, prod_type, color, price, compare_price,
                 image_url, images, sizes, tags, status, inventory,
                 created_at, updated_at) = product
                
                # Use title or name
                product_title = title or name or f"Product {sup_id}"
                product_handle = handle or create_handle(product_title)
                product_id = generate_id('prod')
                
                print(f"\n📦 Processing: {product_title}")
                
                # Prepare metadata
                metadata = {
                    'sku_base': sku or style_code or product_handle,
                    'vendor': vendor or 'KCT Menswear',
                    'style': style_code,
                    'color': color,
                    'price': float(price) if price else 199.99,
                    'compare_at_price': float(compare_price) if compare_price else None,
                    'images': images or [],
                    'category': category,
                    'type': prod_type,
                    'tags': tags or [],
                    'supabase_id': sup_id,
                    'inventory': inventory
                }
                
                # Insert product
                medusa_cur.execute("""
                    INSERT INTO product (
                        id, handle, title, subtitle, description, status,
                        thumbnail, is_giftcard, metadata, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    ON CONFLICT (handle) DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        thumbnail = EXCLUDED.thumbnail,
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()
                    RETURNING id
                """, (
                    product_id, product_handle, product_title,
                    style_code, description or '', 'published',
                    image_url or (images[0] if images else None),
                    False, Json(metadata)
                ))
                
                actual_product_id = medusa_cur.fetchone()[0]
                
                # Determine if this is a suit/tuxedo that needs full size range
                is_suit = (
                    (category and ('suit' in category.lower() or 'tuxedo' in category.lower())) or
                    (prod_type and ('suit' in prod_type.lower() or 'tuxedo' in prod_type.lower())) or
                    ('suit' in product_title.lower() or 'tuxedo' in product_title.lower())
                )
                
                # Create variants
                if is_suit:
                    # Add full size range for suits
                    for size_type, size_list in SIZES.items():
                        for size in size_list:
                            variant_id = generate_id('var')
                            variant_sku = f"{metadata['sku_base']}-{size}"
                            
                            medusa_cur.execute("""
                                INSERT INTO product_variant (
                                    id, product_id, title, sku, manage_inventory,
                                    allow_backorder, metadata, created_at, updated_at
                                ) VALUES (%s, %s, %s, %s, true, false, %s, NOW(), NOW())
                                ON CONFLICT (sku) DO NOTHING
                            """, (
                                variant_id, actual_product_id, size, variant_sku,
                                Json({'size': size, 'size_type': size_type.capitalize()})
                            ))
                elif sizes:
                    # Use sizes from Supabase
                    for size in sizes:
                        variant_id = generate_id('var')
                        variant_sku = f"{metadata['sku_base']}-{size}"
                        
                        medusa_cur.execute("""
                            INSERT INTO product_variant (
                                id, product_id, title, sku, manage_inventory,
                                allow_backorder, metadata, created_at, updated_at
                            ) VALUES (%s, %s, %s, %s, true, false, %s, NOW(), NOW())
                            ON CONFLICT (sku) DO NOTHING
                        """, (
                            variant_id, actual_product_id, size, variant_sku,
                            Json({'size': size})
                        ))
                else:
                    # Single default variant
                    variant_id = generate_id('var')
                    variant_sku = metadata['sku_base']
                    
                    medusa_cur.execute("""
                        INSERT INTO product_variant (
                            id, product_id, title, sku, manage_inventory,
                            allow_backorder, metadata, created_at, updated_at
                        ) VALUES (%s, %s, %s, %s, true, false, %s, NOW(), NOW())
                        ON CONFLICT (sku) DO NOTHING
                    """, (
                        variant_id, actual_product_id, 'Default', variant_sku,
                        Json({'default': True})
                    ))
                
                # Link to sales channel
                medusa_cur.execute("""
                    INSERT INTO product_sales_channel (
                        id, product_id, sales_channel_id, created_at, updated_at
                    )
                    SELECT %s, %s, %s, NOW(), NOW()
                    WHERE NOT EXISTS (
                        SELECT 1 FROM product_sales_channel
                        WHERE product_id = %s AND sales_channel_id = %s
                    )
                """, (
                    generate_id('psc'), actual_product_id,
                    'sc_01K3S6WP4KCEJX26GNPQKTHTBE',
                    actual_product_id, 'sc_01K3S6WP4KCEJX26GNPQKTHTBE'
                ))
                
                success_count += 1
                print(f"  ✅ Migrated: {product_title}")
                
            except Exception as e:
                error_count += 1
                print(f"  ❌ Failed: {product_title} - {str(e)}")
                continue
        
        # 3. Create inventory items and levels
        print("\n📦 Creating inventory items...")
        medusa_cur.execute("""
            INSERT INTO inventory_item (id, sku, created_at, updated_at)
            SELECT DISTINCT
                'invitem_' || substr(gen_random_uuid()::text, 1, 16),
                pv.sku, NOW(), NOW()
            FROM product_variant pv
            WHERE pv.sku IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM inventory_item ii WHERE ii.sku = pv.sku
            )
        """)
        
        print("📊 Setting inventory levels...")
        medusa_cur.execute("""
            INSERT INTO inventory_level (
                id, inventory_item_id, location_id, stocked_quantity,
                reserved_quantity, incoming_quantity, created_at, updated_at
            )
            SELECT 
                'invlvl_' || substr(gen_random_uuid()::text, 1, 16),
                ii.id, 'sloc_01K3RYPKMN8VRRHMZ890XXVWP5',
                10, 0, 0, NOW(), NOW()
            FROM inventory_item ii
            WHERE NOT EXISTS (
                SELECT 1 FROM inventory_level il 
                WHERE il.inventory_item_id = ii.id 
                AND il.location_id = 'sloc_01K3RYPKMN8VRRHMZ890XXVWP5'
            )
        """)
        
        print("🔗 Linking variants to inventory...")
        medusa_cur.execute("""
            INSERT INTO product_variant_inventory_item (
                id, variant_id, inventory_item_id, required_quantity,
                created_at, updated_at
            )
            SELECT 
                'pvii_' || substr(gen_random_uuid()::text, 1, 16),
                pv.id, ii.id, 1, NOW(), NOW()
            FROM product_variant pv
            JOIN inventory_item ii ON ii.sku = pv.sku
            WHERE NOT EXISTS (
                SELECT 1 FROM product_variant_inventory_item pvii
                WHERE pvii.variant_id = pv.id AND pvii.inventory_item_id = ii.id
            )
        """)
        
        # Commit changes
        medusa_conn.commit()
        
        print("\n✨ Migration Complete!")
        print(f"✅ Successfully migrated: {success_count} products")
        print(f"❌ Failed: {error_count} products")
        
        # Show summary
        medusa_cur.execute("""
            SELECT 
                COUNT(DISTINCT p.id) as products,
                COUNT(DISTINCT pv.id) as variants,
                COUNT(DISTINCT ii.id) as inventory_items
            FROM product p
            LEFT JOIN product_variant pv ON pv.product_id = p.id
            LEFT JOIN inventory_item ii ON ii.sku = pv.sku
            WHERE p.metadata->>'supabase_id' IS NOT NULL
        """)
        
        products, variants, inventory = medusa_cur.fetchone()
        print(f"\n📊 Final Stats:")
        print(f"   Products: {products}")
        print(f"   Variants: {variants}")
        print(f"   Inventory Items: {inventory}")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        medusa_conn.rollback()
        raise
    
    finally:
        supabase_cur.close()
        medusa_cur.close()
        supabase_conn.close()
        medusa_conn.close()

if __name__ == "__main__":
    # First, you need to update the Supabase connection details
    print("⚠️  Please update SUPABASE_CONFIG with your Supabase connection details")
    print("   You can find these in your Supabase project settings > Database")
    
    # Uncomment this line after updating the config
    # migrate_products()