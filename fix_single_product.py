#!/usr/bin/env python3
import psycopg2
import json
import uuid
import sys

def generate_id(prefix=''):
    """Generate a unique ID with optional prefix"""
    return f"{prefix}{uuid.uuid4().hex[:24]}"

def fix_product(product_title, price_cents):
    """Fix a single product with all variants and pricing"""
    
    # Database connection
    conn = psycopg2.connect(
        host="centerbeam.proxy.rlwy.net",
        port=20197,
        user="postgres",
        password="MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds",
        database="railway"
    )
    conn.autocommit = False
    cursor = conn.cursor()
    
    # Region ID for US
    REGION_ID = 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
    
    # Define size arrays
    REGULAR_SIZES = ['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R', '54R']
    LONG_SIZES = ['38L', '40L', '42L', '44L', '46L', '48L', '50L', '52L', '54L']
    ALL_SUIT_SIZES = REGULAR_SIZES + LONG_SIZES  # 19 total sizes
    
    try:
        # Find product
        cursor.execute("""
            SELECT id, title, handle 
            FROM product 
            WHERE title = %s AND deleted_at IS NULL
            LIMIT 1
        """, (product_title,))
        
        result = cursor.fetchone()
        if not result:
            print(f"❌ Product not found: {product_title}")
            return False
        
        product_id, title, handle = result
        print(f"✅ Found product: {title}")
        
        # Step 1: Clean up old data
        print("  Cleaning up old variants...")
        
        # Get old variant IDs
        cursor.execute("""
            SELECT id FROM product_variant 
            WHERE product_id = %s
        """, (product_id,))
        old_variant_ids = [row[0] for row in cursor.fetchall()]
        
        if old_variant_ids:
            # Delete in correct order to avoid foreign key issues
            
            # Delete price rules
            cursor.execute("""
                DELETE FROM price_rule 
                WHERE price_id IN (
                    SELECT pr.id 
                    FROM price pr
                    JOIN price_set ps ON pr.price_set_id = ps.id
                    JOIN product_variant_price_set pvps ON ps.id = pvps.price_set_id
                    WHERE pvps.variant_id = ANY(%s)
                )
            """, (old_variant_ids,))
            
            # Delete prices
            cursor.execute("""
                DELETE FROM price 
                WHERE price_set_id IN (
                    SELECT price_set_id 
                    FROM product_variant_price_set 
                    WHERE variant_id = ANY(%s)
                )
            """, (old_variant_ids,))
            
            # Delete product_variant_price_set
            cursor.execute("""
                DELETE FROM product_variant_price_set 
                WHERE variant_id = ANY(%s)
            """, (old_variant_ids,))
            
            # Delete price_sets
            cursor.execute("""
                DELETE FROM price_set 
                WHERE id IN (
                    SELECT DISTINCT price_set_id 
                    FROM product_variant_price_set 
                    WHERE variant_id = ANY(%s)
                )
            """, (old_variant_ids,))
            
            # Delete variants
            cursor.execute("""
                DELETE FROM product_variant 
                WHERE id = ANY(%s)
            """, (old_variant_ids,))
            
            print(f"  Deleted {len(old_variant_ids)} old variants")
        
        # Step 2: Create new variants
        print(f"  Creating {len(ALL_SUIT_SIZES)} new variants...")
        
        sku_base = handle.upper().replace('-', '_')[:20]
        created_count = 0
        
        for size in ALL_SUIT_SIZES:
            variant_id = generate_id('variant_')
            price_set_id = generate_id('pset_')
            price_id = generate_id('price_')
            pvps_id = generate_id('pvps_')
            price_rule_id = generate_id('prule_')
            
            # Create variant
            cursor.execute("""
                INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, created_at, updated_at)
                VALUES (%s, %s, %s, %s, false, NOW(), NOW())
            """, (variant_id, product_id, size, f"{sku_base}-{size}"))
            
            # Create price set
            cursor.execute("""
                INSERT INTO price_set (id, created_at, updated_at)
                VALUES (%s, NOW(), NOW())
            """, (price_set_id,))
            
            # Link variant to price set
            cursor.execute("""
                INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
            """, (pvps_id, variant_id, price_set_id))
            
            # Create price
            raw_amount = json.dumps({"value": str(price_cents), "precision": 20})
            cursor.execute("""
                INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, created_at, updated_at)
                VALUES (%s, %s, 'usd', %s, %s::jsonb, NOW(), NOW())
            """, (price_id, price_set_id, price_cents, raw_amount))
            
            # Add region rule
            cursor.execute("""
                INSERT INTO price_rule (id, value, priority, price_id, attribute, operator, created_at, updated_at)
                VALUES (%s, %s, 0, %s, 'region_id', 'eq', NOW(), NOW())
            """, (price_rule_id, REGION_ID, price_id))
            
            created_count += 1
        
        # Commit transaction
        conn.commit()
        print(f"  ✅ Created {created_count} variants at ${price_cents/100:.2f}")
        
        # Verify
        cursor.execute("""
            SELECT COUNT(*) FROM product_variant 
            WHERE product_id = %s
        """, (product_id,))
        final_count = cursor.fetchone()[0]
        print(f"  ✅ Verification: Product now has {final_count} variants")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"  ❌ Error: {str(e)}")
        cursor.close()
        conn.close()
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 fix_single_product.py \"Product Title\" price_cents")
        print("Example: python3 fix_single_product.py \"Black Suit\" 22999")
        sys.exit(1)
    
    product_title = sys.argv[1]
    price_cents = int(sys.argv[2])
    
    print(f"\nProcessing: {product_title} at ${price_cents/100:.2f}")
    print("-" * 50)
    
    success = fix_product(product_title, price_cents)
    
    if success:
        print("\n✅ SUCCESS - Product fixed!")
    else:
        print("\n❌ FAILED - Check error messages above")
        sys.exit(1)