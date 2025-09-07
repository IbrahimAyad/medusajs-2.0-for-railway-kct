#!/usr/bin/env python3
import psycopg2
import json
import uuid
import time

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

def generate_id(prefix=''):
    """Generate a unique ID with optional prefix"""
    return f"{prefix}{uuid.uuid4().hex[:24]}"

def process_product(product_title, price_cents):
    """Process a single product"""
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
            return False, f"Product not found: {product_title}"
        
        product_id, title, handle = result
        
        # Step 1: Get existing variant IDs
        cursor.execute("""
            SELECT id FROM product_variant 
            WHERE product_id = %s
        """, (product_id,))
        old_variant_ids = [row[0] for row in cursor.fetchall()]
        
        # Step 2: Delete related price data first
        if old_variant_ids:
            # Get price_set_ids from product_variant_price_set
            cursor.execute("""
                SELECT price_set_id FROM product_variant_price_set 
                WHERE variant_id = ANY(%s)
            """, (old_variant_ids,))
            price_set_ids = [row[0] for row in cursor.fetchall() if row[0]]
            
            if price_set_ids:
                # Get price_ids from price table
                cursor.execute("""
                    SELECT id FROM price 
                    WHERE price_set_id = ANY(%s)
                """, (price_set_ids,))
                price_ids = [row[0] for row in cursor.fetchall()]
                
                if price_ids:
                    # Delete price rules
                    cursor.execute("""
                        DELETE FROM price_rule 
                        WHERE price_id = ANY(%s)
                    """, (price_ids,))
                
                # Delete prices
                cursor.execute("""
                    DELETE FROM price 
                    WHERE price_set_id = ANY(%s)
                """, (price_set_ids,))
            
            # Delete product_variant_price_set entries
            cursor.execute("""
                DELETE FROM product_variant_price_set 
                WHERE variant_id = ANY(%s)
            """, (old_variant_ids,))
            
            # Delete price_sets
            if price_set_ids:
                cursor.execute("""
                    DELETE FROM price_set 
                    WHERE id = ANY(%s)
                """, (price_set_ids,))
            
            # Delete variants
            cursor.execute("""
                DELETE FROM product_variant 
                WHERE product_id = %s
            """, (product_id,))
        
        # Step 3: Create new variants with pricing
        sku_base = handle.upper().replace('-', '_')[:20]  # Limit SKU base length
        
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
        
        conn.commit()
        return True, f"✅ Fixed {title} with {len(ALL_SUIT_SIZES)} variants at ${price_cents/100:.2f}"
        
    except Exception as e:
        conn.rollback()
        return False, f"❌ Error processing {product_title}: {str(e)}"

# Product lists with prices
products_to_fix = [
    # Regular Suits - $229.99
    ("2 PC Double Breasted Solid Suit", 22999),
    ("2 PC Satin Shawl Collar Suit - Ivory/Burgundy", 22999),
    ("Black Pinstripe Shawl Lapel Double-Breasted Suit", 22999),
    ("Black Strip Shawl Lapel", 22999),
    ("Black Suit", 22999),
    ("Brown Gold Buttons", 22999),
    ("Brown Suit", 22999),
    ("Burnt Orange", 22999),
    ("Classic Navy Suit", 22999),
    ("Classic Navy Two-Piece Suit", 22999),
    ("Dark Teal", 22999),
    ("Estate Blue", 22999),
    ("Fall Forest Green Mocha Double Breasted Suit", 22999),
    ("Fall Mocha Double Breasted Suit", 22999),
    ("Fall Rust", 22999),
    ("Fall Smoked Blue Double Breasted Suit", 22999),
    ("Forest Green Mocha Double-Breasted Suit", 22999),
    ("Light Grey", 22999),
    ("Mint", 22999),
    ("Navy Blue Performance Stretch Suit", 22999),
    ("Navy Suit", 22999),
    ("Pin Stripe Black", 22999),
    ("Pin Stripe Brown", 22999),
    ("Pin Stripe Canyon Clay Double Breasted Suit", 22999),
    ("Pin Stripe Grey", 22999),
    ("Pin Stripe Navy", 22999),
    ("Pink", 22999),
    ("Brick Fall Suit", 22999),
    
    # $199.99 Tuxedos
    ("Black On Black Slim Tuxedo Tone Trim Tuxedo", 19999),
    ("Black Tuxedo", 19999),
    ("Blush Tuxedo", 19999),
    ("Burnt Orange Tuxedo", 19999),
    ("Classic Black Tuxedo with Satin Lapels", 19999),
    ("Hunter Green Tuxedo", 19999),
    ("Light Grey On Light Grey Slim Tuxedo Tone Trim Tuxedo", 19999),
    ("Navy Tone Trim Tuxedo", 19999),
    ("Sand Tuxedo", 19999),
    ("Tan Tuxedo Double Breasted", 19999),
    ("Wine On Wine Slim Tuxedotone Trim Tuxedo", 19999),
    
    # $229.99 Tuxedos
    ("Black Tone Trim Tuxedo Shawl Lapel", 22999),
    ("Red Tuxedo Double Breasted", 22999),
    ("White Black Tuxedo", 22999),
    ("White Tuxedo Double Breasted", 22999),
    
    # $249.99 Tuxedos
    ("Black Gold Design Tuxedo", 24999),
    ("Black Paisley Tuxedo", 24999),
    ("Blush Pink Paisley Tuxedo", 24999),
    ("Gold Paisley Tuxedo", 24999),
    ("Ivory Black Tone Trim Tuxedo", 24999),
    ("Ivory Gold Paisley Tuxedo", 24999),
    ("Ivory Paisley Tuxedo", 24999),
    ("Notch Lapel Black Velvet Tuxedo", 24999),
    ("Notch Lapel Navy Velvet Tuxedo", 24999),
    ("Pink Gold Design Tuxedo", 24999),
    ("Vivid Purple Tuxedo Tone Trim Tuxedo", 24999)
]

print("=" * 80)
print("PROCESSING SUITS & TUXEDOS IN BATCHES")
print("=" * 80)
print(f"Total products to process: {len(products_to_fix)}")
print("-" * 80)

success_count = 0
failed_count = 0
batch_size = 5

for i in range(0, len(products_to_fix), batch_size):
    batch = products_to_fix[i:i+batch_size]
    print(f"\nProcessing batch {i//batch_size + 1} ({i+1}-{min(i+batch_size, len(products_to_fix))} of {len(products_to_fix)}):")
    
    for product_title, price_cents in batch:
        success, message = process_product(product_title, price_cents)
        print(f"  {message}")
        
        if success:
            success_count += 1
        else:
            failed_count += 1
        
        # Small delay between products
        time.sleep(0.5)
    
    print(f"  Batch complete. Success: {success_count}, Failed: {failed_count}")

print("\n" + "=" * 80)
print("FINAL SUMMARY")
print("=" * 80)
print(f"✅ Successfully processed: {success_count} products")
print(f"❌ Failed: {failed_count} products")

# Verify sample products
print("\n🔍 VERIFYING SAMPLE PRODUCTS...")
sample_products = ["Black Suit", "Black Tuxedo", "Navy Suit"]

for product_name in sample_products:
    cursor.execute("""
        SELECT 
            p.title,
            COUNT(DISTINCT pv.id) as variant_count,
            COUNT(DISTINCT pvps.id) as price_links,
            MIN(pr.amount/100.0) as min_price,
            MAX(pr.amount/100.0) as max_price
        FROM product p
        LEFT JOIN product_variant pv ON p.id = pv.product_id
        LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
        LEFT JOIN price_set ps ON pvps.price_set_id = ps.id
        LEFT JOIN price pr ON ps.id = pr.price_set_id
        WHERE p.title = %s
        AND p.deleted_at IS NULL
        GROUP BY p.title
    """, (product_name,))
    
    result = cursor.fetchone()
    if result:
        print(f"  {result[0]}:")
        print(f"    - Variants: {result[1]}")
        print(f"    - Price links: {result[2]}")
        print(f"    - Price: ${result[3]:.2f}" if result[3] else "    - Price: Not set")

cursor.close()
conn.close()

print("\n✅ PROCESSING COMPLETE!")
print("Next steps:")
print("1. Test checkout with a few products")
print("2. Update PARALLEL_WORK_COORDINATION.md with completion status")