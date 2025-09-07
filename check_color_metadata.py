#!/usr/bin/env python3
import psycopg2
import json
import re

# Database connection
conn = psycopg2.connect(
    host="centerbeam.proxy.rlwy.net",
    port=20197,
    user="postgres",
    password="MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds",
    database="railway"
)
cursor = conn.cursor()

# Products I fixed in Instance 1
my_products = [
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
    "Brick Fall Suit",
    "Satin Shawl Collar Suit",
    # Tuxedos
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
    "Wine On Wine Slim Tuxedotone Trim Tuxedo",
    "Black Tuxedo with Satin Lapels",
    "Black Tone Trim Tuxedo Shawl Lapel",
    "Red Tuxedo Double Breasted",
    "White Black Tuxedo",
    "White Tuxedo Double Breasted",
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

def extract_color_from_title(title):
    """Extract color from product title"""
    title_lower = title.lower()
    
    # Define color mappings
    colors = {
        'black': 'Black',
        'navy': 'Navy',
        'blue': 'Blue',
        'grey': 'Grey',
        'gray': 'Grey',
        'brown': 'Brown',
        'burgundy': 'Burgundy',
        'ivory': 'Ivory',
        'white': 'White',
        'pink': 'Pink',
        'blush': 'Blush Pink',
        'burnt orange': 'Burnt Orange',
        'orange': 'Orange',
        'hunter green': 'Hunter Green',
        'forest green': 'Forest Green',
        'green': 'Green',
        'teal': 'Teal',
        'mint': 'Mint',
        'sand': 'Sand',
        'tan': 'Tan',
        'wine': 'Wine',
        'red': 'Red',
        'gold': 'Gold',
        'purple': 'Purple',
        'rust': 'Rust',
        'mocha': 'Mocha Brown',
        'smoked blue': 'Smoky Blue',
        'estate blue': 'Estate Blue',
        'canyon clay': 'Canyon Clay',
        'brick': 'Brick Red'
    }
    
    # Check for multiple colors (e.g., "Black Gold Design")
    found_colors = []
    for color_key, color_value in colors.items():
        if color_key in title_lower:
            found_colors.append(color_value)
    
    # Return primary color or combination
    if len(found_colors) > 1:
        # For patterns like "Black Gold", keep both
        if 'gold' in title_lower and ('design' in title_lower or 'paisley' in title_lower):
            return ' & '.join(found_colors[:2])
        else:
            return found_colors[0]  # Return primary color
    elif found_colors:
        return found_colors[0]
    
    # Default color for suits without specific color
    if 'suit' in title_lower or 'tuxedo' in title_lower:
        return 'Classic'
    
    return None

print("ANALYZING COLOR METADATA FOR SUITS & TUXEDOS")
print("=" * 60)

# Check each product
products_missing_color = []
products_with_color = []

for product_title in my_products:
    cursor.execute("""
        SELECT id, title, metadata
        FROM product
        WHERE title = %s AND deleted_at IS NULL
    """, (product_title,))
    
    result = cursor.fetchone()
    if result:
        product_id, title, metadata = result
        
        # Check if color exists in metadata
        has_color = False
        current_color = None
        
        if metadata:
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except:
                    metadata = {}
            
            current_color = metadata.get('color')
            if current_color:
                has_color = True
        
        if has_color:
            products_with_color.append((product_id, title, current_color))
        else:
            # Extract color from title
            suggested_color = extract_color_from_title(title)
            products_missing_color.append((product_id, title, suggested_color))

print(f"\nProducts WITH color metadata: {len(products_with_color)}")
if products_with_color:
    for _, title, color in products_with_color[:5]:
        print(f"  ✓ {title}: {color}")
    if len(products_with_color) > 5:
        print(f"  ... and {len(products_with_color) - 5} more")

print(f"\nProducts MISSING color metadata: {len(products_missing_color)}")
if products_missing_color:
    print("\nSuggested colors to add:")
    for product_id, title, suggested_color in products_missing_color:
        if suggested_color:
            print(f"  {title}")
            print(f"    → Add color: {suggested_color}")
        else:
            print(f"  {title}")
            print(f"    → ⚠️  Could not determine color")

# Also check for other important metadata
print("\n" + "=" * 60)
print("CHECKING OTHER SEO METADATA")
print("=" * 60)

cursor.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN metadata::text LIKE '%color%' THEN 1 END) as has_color,
        COUNT(CASE WHEN metadata::text LIKE '%material%' THEN 1 END) as has_material,
        COUNT(CASE WHEN metadata::text LIKE '%fit%' THEN 1 END) as has_fit,
        COUNT(CASE WHEN metadata::text LIKE '%occasion%' THEN 1 END) as has_occasion
    FROM product
    WHERE title = ANY(%s) AND deleted_at IS NULL
""", (my_products,))

result = cursor.fetchone()
if result:
    total, has_color, has_material, has_fit, has_occasion = result
    print(f"Total products: {total}")
    print(f"Has color metadata: {has_color} ({has_color*100//total if total > 0 else 0}%)")
    print(f"Has material metadata: {has_material} ({has_material*100//total if total > 0 else 0}%)")
    print(f"Has fit metadata: {has_fit} ({has_fit*100//total if total > 0 else 0}%)")
    print(f"Has occasion metadata: {has_occasion} ({has_occasion*100//total if total > 0 else 0}%)")

cursor.close()
conn.close()

print("\n" + "=" * 60)
print(f"TOTAL PRODUCTS NEEDING COLOR METADATA: {len(products_missing_color)}")
if products_missing_color:
    print("Run 'python3 add_color_metadata.py' to add colors to these products.")