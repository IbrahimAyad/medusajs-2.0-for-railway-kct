#!/usr/bin/env python3
import psycopg2

conn = psycopg2.connect(
    host='centerbeam.proxy.rlwy.net',
    port=20197,
    user='postgres',
    password='MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds',
    database='railway'
)
cursor = conn.cursor()

print('VERIFICATION REPORT FOR SUITS & TUXEDOS')
print('=' * 60)

# Get summary stats
cursor.execute('''
    SELECT 
        CASE 
            WHEN p.title LIKE '%Tuxedo%' THEN 'Tuxedo'
            ELSE 'Suit'
        END as product_type,
        COUNT(DISTINCT p.id) as product_count,
        COUNT(pv.id) as total_variants,
        COUNT(DISTINCT pv.product_id) as products_with_variants
    FROM product p
    LEFT JOIN product_variant pv ON p.id = pv.product_id
    WHERE (p.title LIKE '%Suit%' OR p.title LIKE '%Tuxedo%' 
           OR p.title IN ('Burnt Orange', 'Dark Teal', 'Estate Blue', 'Light Grey', 'Mint', 'Pink', 
                         'Brown Gold Buttons', 'Black Strip Shawl Lapel', 'Fall Rust', 'Brick Fall Suit'))
    AND p.deleted_at IS NULL
    GROUP BY product_type
''')

print('\nProduct Type Summary:')
for row in cursor.fetchall():
    print(f'  {row[0]}: {row[1]} products, {row[2]} total variants')

# Count total products fixed
cursor.execute('''
    SELECT COUNT(DISTINCT p.id) as total_products
    FROM product p
    JOIN product_variant pv ON p.id = pv.product_id
    WHERE (p.title LIKE '%Suit%' OR p.title LIKE '%Tuxedo%' 
           OR p.title IN ('Burnt Orange', 'Dark Teal', 'Estate Blue', 'Light Grey', 'Mint', 'Pink', 
                         'Brown Gold Buttons', 'Black Strip Shawl Lapel', 'Fall Rust', 'Brick Fall Suit'))
    AND p.deleted_at IS NULL
    GROUP BY p.id
    HAVING COUNT(pv.id) = 19
''')

total_fixed = len(cursor.fetchall())
print(f'\n✅ Total products successfully fixed: {total_fixed}')

# Check variant counts
cursor.execute('''
    SELECT p.title, COUNT(pv.id) as variant_count
    FROM product p
    LEFT JOIN product_variant pv ON p.id = pv.product_id
    WHERE (p.title LIKE '%Suit%' OR p.title LIKE '%Tuxedo%' 
           OR p.title IN ('Burnt Orange', 'Dark Teal', 'Estate Blue', 'Light Grey', 'Mint', 'Pink', 
                         'Brown Gold Buttons', 'Black Strip Shawl Lapel', 'Fall Rust', 'Brick Fall Suit'))
    AND p.deleted_at IS NULL
    GROUP BY p.title
    HAVING COUNT(pv.id) != 19
    ORDER BY p.title
''')

incorrect = cursor.fetchall()
if incorrect:
    print('\n⚠️  Products with INCORRECT variant count (should be 19):')
    for row in incorrect:
        print(f'  - {row[0]}: {row[1]} variants')
else:
    print('\n✅ All products have correct variant count (19)')

# Check pricing by category
print('\nPricing Verification by Category:')

# Regular Suits - $229.99
cursor.execute('''
    SELECT COUNT(DISTINCT p.id)
    FROM product p
    JOIN product_variant pv ON p.id = pv.product_id
    JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
    JOIN price_set ps ON pvps.price_set_id = ps.id
    JOIN price pr ON ps.id = pr.price_set_id
    WHERE pr.amount = 22999
    AND p.title NOT LIKE '%Tuxedo%'
    AND (p.title LIKE '%Suit%' OR p.title IN ('Burnt Orange', 'Dark Teal', 'Estate Blue', 
         'Light Grey', 'Mint', 'Pink', 'Brown Gold Buttons', 'Black Strip Shawl Lapel', 
         'Fall Rust', 'Brick Fall Suit'))
    AND p.deleted_at IS NULL
''')
suits_229 = cursor.fetchone()[0]
print(f'  Regular Suits at $229.99: {suits_229} products')

# Tuxedos at different prices
for price, amount in [('$199.99', 19999), ('$229.99', 22999), ('$249.99', 24999)]:
    cursor.execute('''
        SELECT COUNT(DISTINCT p.id)
        FROM product p
        JOIN product_variant pv ON p.id = pv.product_id
        JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
        JOIN price_set ps ON pvps.price_set_id = ps.id
        JOIN price pr ON ps.id = pr.price_set_id
        WHERE pr.amount = %s
        AND p.title LIKE '%Tuxedo%'
        AND p.deleted_at IS NULL
    ''', (amount,))
    count = cursor.fetchone()[0]
    print(f'  Tuxedos at {price}: {count} products')

# Check manage_inventory flag
cursor.execute('''
    SELECT COUNT(*) 
    FROM product_variant pv
    JOIN product p ON pv.product_id = p.id
    WHERE (p.title LIKE '%Suit%' OR p.title LIKE '%Tuxedo%' 
           OR p.title IN ('Burnt Orange', 'Dark Teal', 'Estate Blue', 'Light Grey', 'Mint', 'Pink', 
                         'Brown Gold Buttons', 'Black Strip Shawl Lapel', 'Fall Rust', 'Brick Fall Suit'))
    AND p.deleted_at IS NULL
    AND pv.manage_inventory = true
''')

inventory_managed = cursor.fetchone()[0]
if inventory_managed > 0:
    print(f'\n⚠️  {inventory_managed} variants still have manage_inventory = true')
else:
    print('\n✅ All variants have manage_inventory = false')

cursor.close()
conn.close()

print('\n' + '=' * 60)
print('VERIFICATION COMPLETE - INSTANCE 1 (SUITS & TUXEDOS)')
print('=' * 60)