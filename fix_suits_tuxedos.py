#!/usr/bin/env python3
import psycopg2
import json
from datetime import datetime
import uuid

# Database connection
conn = psycopg2.connect(
    host="centerbeam.proxy.rlwy.net",
    port=20197,
    user="postgres",
    password="MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds",
    database="railway"
)
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

def delete_old_variants(product_id, product_name):
    """Delete existing variants for a product"""
    print(f"  Deleting old variants for: {product_name}")
    
    # First get all variant IDs to clean up related data
    cursor.execute("""
        SELECT id FROM product_variant 
        WHERE product_id = %s
    """, (product_id,))
    variant_ids = [row[0] for row in cursor.fetchall()]
    
    if variant_ids:
        # Delete from product_variant_price_set
        cursor.execute("""
            DELETE FROM product_variant_price_set 
            WHERE variant_id = ANY(%s)
        """, (variant_ids,))
        
        # Delete variants
        cursor.execute("""
            DELETE FROM product_variant 
            WHERE product_id = %s
        """, (product_id,))
        
        print(f"    Deleted {len(variant_ids)} old variants")
    
    conn.commit()

def create_variant_with_price(product_id, size, sku_base, price_cents):
    """Create a variant with proper pricing structure"""
    variant_id = generate_id('variant_')
    price_set_id = generate_id('pset_')
    price_id = generate_id('price_')
    pvps_id = generate_id('pvps_')
    price_rule_id = generate_id('prule_')
    
    # Create variant
    cursor.execute("""
        INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, created_at, updated_at)
        VALUES (%s, %s, %s, %s, false, NOW(), NOW())
    """, (variant_id, product_id, size, f"{sku_base}-{size}", ))
    
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

def fix_product(product_title, price_cents):
    """Fix a single product by title"""
    # Find product
    cursor.execute("""
        SELECT id, title, handle FROM product 
        WHERE title = %s AND deleted_at IS NULL
    """, (product_title,))
    
    result = cursor.fetchone()
    if not result:
        print(f"  ❌ Product not found: {product_title}")
        return False
    
    product_id, title, handle = result
    print(f"  ✅ Found product: {title}")
    
    # Delete old variants
    delete_old_variants(product_id, title)
    
    # Create new variants
    sku_base = handle.upper().replace('-', '_')
    for size in ALL_SUIT_SIZES:
        create_variant_with_price(product_id, size, sku_base, price_cents)
    
    conn.commit()
    print(f"    Created {len(ALL_SUIT_SIZES)} new variants at ${price_cents/100:.2f}")
    return True

print("=" * 80)
print("FIXING SUITS & TUXEDOS - INSTANCE 1")
print("=" * 80)

# Track progress
fixed_count = 0
failed_products = []

print("\n📦 PROCESSING REGULAR SUITS ($229.99)")
print("-" * 40)

regular_suits = [
    "2 PC Double Breasted Solid Suit",
    "2 PC Satin Shawl Collar Suit - Ivory/Burgundy",
    "Black Pinstripe Shawl Lapel Double-Breasted Suit",
    "Black Strip Shawl Lapel",
    "Black Suit",
    "Brown Gold Buttons",
    "Brown Suit",
    "Burnt Orange",
    "Classic Navy Suit",
    "Classic Navy Two-Piece Suit",
    "Dark Teal",
    "Estate Blue",
    "Fall Forest Green Mocha Double Breasted Suit",
    "Fall Mocha Double Breasted Suit",
    "Fall Rust",
    "Fall Smoked Blue Double Breasted Suit",
    "Forest Green Mocha Double-Breasted Suit",
    "Light Grey",
    "Mint",
    "Navy Blue Performance Stretch Suit",
    "Navy Suit",
    "Pin Stripe Black",
    "Pin Stripe Brown",
    "Pin Stripe Canyon Clay Double Breasted Suit",
    "Pin Stripe Grey",
    "Pin Stripe Navy",
    "Pink",
    "Brick Fall Suit"
]

for suit in regular_suits:
    if fix_product(suit, 22999):  # $229.99
        fixed_count += 1
    else:
        failed_products.append(suit)

print("\n🎩 PROCESSING $199.99 TUXEDOS")
print("-" * 40)

tuxedos_199 = [
    "Black On Black Slim Tuxedo Tone Trim Tuxedo",
    "Black Tuxedo",
    "Blush Tuxedo",
    "Burnt Orange Tuxedo",
    "Classic Black Tuxedo with Satin Lapels",
    "Hunter Green Tuxedo",
    "Light Grey On Light Grey Slim Tuxedo Tone Trim Tuxedo",
    "Navy Tone Trim Tuxedo",
    "Sand Tuxedo",
    "Tan Tuxedo Double Breasted",
    "Wine On Wine Slim Tuxedotone Trim Tuxedo"
]

for tux in tuxedos_199:
    if fix_product(tux, 19999):  # $199.99
        fixed_count += 1
    else:
        failed_products.append(tux)

print("\n🎩 PROCESSING $229.99 TUXEDOS")
print("-" * 40)

tuxedos_229 = [
    "Black Tone Trim Tuxedo Shawl Lapel",
    "Red Tuxedo Double Breasted",
    "White Black Tuxedo",
    "White Tuxedo Double Breasted"
]

for tux in tuxedos_229:
    if fix_product(tux, 22999):  # $229.99
        fixed_count += 1
    else:
        failed_products.append(tux)

print("\n💎 PROCESSING $249.99 TUXEDOS")
print("-" * 40)

tuxedos_249 = [
    "Black Gold Design Tuxedo",
    "Black Paisley Tuxedo",
    "Blush Pink Paisley Tuxedo",
    "Gold Paisley Tuxedo",
    "Ivory Black Tone Trim Tuxedo",
    "Ivory Gold Paisley Tuxedo",
    "Ivory Paisley Tuxedo",
    "Notch Lapel Black Velvet Tuxedo",
    "Notch Lapel Navy Velvet Tuxedo",
    "Pink Gold Design Tuxedo",
    "Vivid Purple Tuxedo Tone Trim Tuxedo"
]

for tux in tuxedos_249:
    if fix_product(tux, 24999):  # $249.99
        fixed_count += 1
    else:
        failed_products.append(tux)

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✅ Successfully fixed: {fixed_count} products")
print(f"❌ Failed/Not found: {len(failed_products)} products")

if failed_products:
    print("\nProducts that couldn't be found:")
    for product in failed_products:
        print(f"  - {product}")

# Verify a sample product
print("\n🔍 VERIFYING SAMPLE PRODUCT...")
cursor.execute("""
    SELECT p.title, COUNT(pv.id) as variant_count
    FROM product p
    LEFT JOIN product_variant pv ON p.id = pv.product_id
    WHERE p.title = 'Black Suit'
    AND p.deleted_at IS NULL
    GROUP BY p.title
""")
result = cursor.fetchone()
if result:
    print(f"  {result[0]}: {result[1]} variants")

cursor.close()
conn.close()

print("\n✅ SCRIPT COMPLETE!")
print("Please test checkout with a few products to ensure everything works correctly.")