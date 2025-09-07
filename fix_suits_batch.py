#!/usr/bin/env python3
import psycopg2
import json
import sys
import uuid
from psycopg2.extras import execute_values

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

def check_product_exists(title):
    """Check if product exists and get its info"""
    cursor.execute("""
        SELECT id, title, handle 
        FROM product 
        WHERE title = %s AND deleted_at IS NULL
        LIMIT 1
    """, (title,))
    return cursor.fetchone()

# First, let's check which products exist
print("Checking which products exist in database...")
print("-" * 50)

all_products = {
    "Regular Suits ($229.99)": [
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
    ],
    "$199.99 Tuxedos": [
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
    ],
    "$229.99 Tuxedos": [
        "Black Tone Trim Tuxedo Shawl Lapel",
        "Red Tuxedo Double Breasted",
        "White Black Tuxedo",
        "White Tuxedo Double Breasted"
    ],
    "$249.99 Tuxedos": [
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
}

found_products = []
missing_products = []

for category, products in all_products.items():
    print(f"\n{category}:")
    for product_title in products:
        result = check_product_exists(product_title)
        if result:
            found_products.append((result[0], result[1], result[2], category))
            print(f"  ✅ {product_title}")
        else:
            missing_products.append(product_title)
            print(f"  ❌ {product_title} - NOT FOUND")

print(f"\n\nSUMMARY:")
print(f"Found: {len(found_products)} products")
print(f"Missing: {len(missing_products)} products")

if len(found_products) == 0:
    print("\n❌ No products found to fix!")
    cursor.close()
    conn.close()
    sys.exit(1)

# Now let's check if any found products might be duplicates or have similar names
if missing_products:
    print("\n\nSearching for similar product names for missing items...")
    for missing in missing_products[:5]:  # Check first 5 missing
        search_term = missing.split()[0] if missing.split() else missing
        cursor.execute("""
            SELECT title FROM product 
            WHERE title ILIKE %s 
            AND deleted_at IS NULL
            LIMIT 5
        """, (f'%{search_term}%',))
        similar = cursor.fetchall()
        if similar:
            print(f"\n  Missing: '{missing}'")
            print(f"  Similar products found:")
            for s in similar:
                print(f"    - {s[0]}")

cursor.close()
conn.close()

print("\n\n✅ Analysis complete!")
print(f"Ready to fix {len(found_products)} products.")
print("\nRun 'python3 process_found_products.py' to fix the found products.")