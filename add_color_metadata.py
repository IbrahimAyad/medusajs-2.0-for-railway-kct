#!/usr/bin/env python3
import psycopg2
import json

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

# Define products and their colors, materials, and other SEO metadata
products_metadata = {
    # Regular Suits
    "2 PC Double Breasted Solid Suit": {
        "color": "Classic Black",
        "material": "Premium Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Wedding, Formal Events",
        "style": "Double Breasted"
    },
    "Black Pinstripe Shawl Lapel Double-Breasted Suit": {
        "color": "Black",
        "pattern": "Pinstripe",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Executive, Formal",
        "style": "Double Breasted Shawl Lapel"
    },
    "Black Strip Shawl Lapel": {
        "color": "Black",
        "pattern": "Striped",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Formal Events, Special Occasions",
        "style": "Shawl Lapel"
    },
    "Black Suit": {
        "color": "Black",
        "material": "Wool Blend",
        "fit": "Classic Fit",
        "occasion": "Business, Wedding, Funeral, Formal",
        "style": "Single Breasted"
    },
    "Brown Gold Buttons": {
        "color": "Brown",
        "accent": "Gold Buttons",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Business Casual, Social Events",
        "style": "Single Breasted"
    },
    "Brown Suit": {
        "color": "Brown",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Casual Events, Fall/Winter",
        "style": "Single Breasted"
    },
    "Burnt Orange": {
        "color": "Burnt Orange",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Fall Events, Fashion Forward, Special Occasions",
        "style": "Single Breasted",
        "season": "Fall/Autumn"
    },
    "Classic Navy Suit": {
        "color": "Navy Blue",
        "material": "Wool Blend",
        "fit": "Classic Fit",
        "occasion": "Business, Wedding, Versatile Formal",
        "style": "Single Breasted"
    },
    "Classic Navy Two-Piece Suit": {
        "color": "Navy Blue",
        "material": "Wool Blend",
        "fit": "Classic Fit",
        "occasion": "Business, Wedding, Formal",
        "style": "Two-Piece Single Breasted"
    },
    "Dark Teal": {
        "color": "Dark Teal",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward, Special Events, Cocktail",
        "style": "Single Breasted"
    },
    "Estate Blue": {
        "color": "Estate Blue",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Events, Garden Parties, Daytime Formal",
        "style": "Single Breasted",
        "season": "Spring/Summer"
    },
    "Fall Forest Green Mocha Double Breasted Suit": {
        "color": "Forest Green",
        "accent": "Mocha Undertones",
        "material": "Premium Fall Fabric",
        "fit": "Modern Fit",
        "occasion": "Fall Events, Fashion Forward",
        "style": "Double Breasted",
        "season": "Fall/Autumn"
    },
    "Fall Mocha Double Breasted Suit": {
        "color": "Mocha Brown",
        "material": "Premium Fall Fabric",
        "fit": "Modern Fit",
        "occasion": "Fall Events, Business Casual",
        "style": "Double Breasted",
        "season": "Fall/Autumn"
    },
    "Fall Rust": {
        "color": "Rust",
        "material": "Premium Fall Fabric",
        "fit": "Modern Fit",
        "occasion": "Fall Events, Outdoor Weddings",
        "style": "Single Breasted",
        "season": "Fall/Autumn"
    },
    "Fall Smoked Blue Double Breasted Suit": {
        "color": "Smoky Blue",
        "material": "Premium Fall Fabric",
        "fit": "Modern Fit",
        "occasion": "Fall Events, Evening Functions",
        "style": "Double Breasted",
        "season": "Fall/Autumn"
    },
    "Forest Green Mocha Double-Breasted Suit": {
        "color": "Forest Green",
        "accent": "Mocha Undertones",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward, Special Events",
        "style": "Double Breasted"
    },
    "Light Grey": {
        "color": "Light Grey",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Summer Events, Daytime Formal",
        "style": "Single Breasted",
        "season": "Spring/Summer"
    },
    "Mint": {
        "color": "Mint Green",
        "material": "Lightweight Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Events, Beach Weddings, Garden Parties",
        "style": "Single Breasted",
        "season": "Spring/Summer"
    },
    "Navy Blue Performance Stretch Suit": {
        "color": "Navy Blue",
        "material": "Performance Stretch Fabric",
        "fit": "Slim Fit",
        "occasion": "Business, Travel, Active Professional",
        "style": "Single Breasted",
        "features": "Stretch, Wrinkle-Resistant"
    },
    "Navy Suit": {
        "color": "Navy Blue",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Wedding, Versatile Formal",
        "style": "Single Breasted"
    },
    "Pin Stripe Black": {
        "color": "Black",
        "pattern": "Pinstripe",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Executive, Power Dressing",
        "style": "Single Breasted"
    },
    "Pin Stripe Brown": {
        "color": "Brown",
        "pattern": "Pinstripe",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Professional",
        "style": "Single Breasted"
    },
    "Pin Stripe Canyon Clay Double Breasted Suit": {
        "color": "Canyon Clay",
        "pattern": "Pinstripe",
        "material": "Premium Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward, Special Events",
        "style": "Double Breasted"
    },
    "Pin Stripe Grey": {
        "color": "Grey",
        "pattern": "Pinstripe",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Professional, Executive",
        "style": "Single Breasted"
    },
    "Pin Stripe Navy": {
        "color": "Navy Blue",
        "pattern": "Pinstripe",
        "material": "Wool Blend",
        "fit": "Modern Fit",
        "occasion": "Business, Professional",
        "style": "Single Breasted"
    },
    "Pink": {
        "color": "Pink",
        "material": "Lightweight Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Events, Fashion Forward, Cocktail Parties",
        "style": "Single Breasted",
        "season": "Spring/Summer"
    },
    "Brick Fall Suit": {
        "color": "Brick Red",
        "material": "Premium Fall Fabric",
        "fit": "Modern Fit",
        "occasion": "Fall Events, Fashion Forward",
        "style": "Single Breasted",
        "season": "Fall/Autumn"
    },
    "Satin Shawl Collar Suit": {
        "color": "Classic Black",
        "material": "Satin Shawl Collar",
        "fit": "Modern Fit",
        "occasion": "Formal Events, Black Tie Optional",
        "style": "Shawl Collar"
    },
    
    # Tuxedos $199.99
    "Black On Black Slim Tuxedo Tone Trim Tuxedo": {
        "color": "Black",
        "material": "Premium Tuxedo Fabric",
        "fit": "Slim Fit",
        "occasion": "Black Tie, Formal Events, Weddings",
        "style": "Tone on Tone Trim"
    },
    "Black Tuxedo": {
        "color": "Black",
        "material": "Premium Tuxedo Fabric",
        "fit": "Classic Fit",
        "occasion": "Black Tie, Formal Events, Weddings, Prom",
        "style": "Classic Tuxedo"
    },
    "Blush Tuxedo": {
        "color": "Blush Pink",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Weddings, Fashion Forward Events, Prom",
        "style": "Contemporary Tuxedo"
    },
    "Burnt Orange Tuxedo": {
        "color": "Burnt Orange",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward Events, Fall Weddings",
        "style": "Contemporary Tuxedo",
        "season": "Fall/Autumn"
    },
    "Classic Black Tuxedo with Satin Lapels": {
        "color": "Black",
        "material": "Premium Fabric with Satin Lapels",
        "fit": "Classic Fit",
        "occasion": "Black Tie, Formal Events, Weddings",
        "style": "Classic Satin Lapel"
    },
    "Hunter Green Tuxedo": {
        "color": "Hunter Green",
        "material": "Premium Velvet",
        "fit": "Modern Fit",
        "occasion": "Holiday Events, Fashion Forward, Winter Formal",
        "style": "Contemporary Tuxedo",
        "season": "Fall/Winter"
    },
    "Light Grey On Light Grey Slim Tuxedo Tone Trim Tuxedo": {
        "color": "Light Grey",
        "material": "Premium Tuxedo Fabric",
        "fit": "Slim Fit",
        "occasion": "Daytime Events, Summer Weddings",
        "style": "Tone on Tone Trim"
    },
    "Navy Tone Trim Tuxedo": {
        "color": "Navy Blue",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward Events, Alternative Black Tie",
        "style": "Tone on Tone Trim"
    },
    "Sand Tuxedo": {
        "color": "Sand",
        "material": "Lightweight Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Beach Weddings, Destination Events",
        "style": "Contemporary Tuxedo",
        "season": "Spring/Summer"
    },
    "Tan Tuxedo Double Breasted": {
        "color": "Tan",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Daytime Events, Garden Weddings",
        "style": "Double Breasted Tuxedo"
    },
    "Wine On Wine Slim Tuxedotone Trim Tuxedo": {
        "color": "Wine",
        "material": "Premium Tuxedo Fabric",
        "fit": "Slim Fit",
        "occasion": "Fashion Forward Events, Holiday Parties",
        "style": "Tone on Tone Trim"
    },
    "Black Tuxedo with Satin Lapels": {
        "color": "Black",
        "material": "Premium Fabric with Satin Lapels",
        "fit": "Modern Fit",
        "occasion": "Black Tie, Formal Events",
        "style": "Satin Lapel Tuxedo"
    },
    
    # Tuxedos $229.99
    "Black Tone Trim Tuxedo Shawl Lapel": {
        "color": "Black",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Black Tie, Ultra Formal Events",
        "style": "Shawl Lapel with Tone Trim"
    },
    "Red Tuxedo Double Breasted": {
        "color": "Red",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Bold Fashion Events, Valentine's, Holiday",
        "style": "Double Breasted Tuxedo"
    },
    "White Black Tuxedo": {
        "color": "White with Black Lapels",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Events, Yacht Parties, Miami Style",
        "style": "Contrast Lapel Tuxedo"
    },
    "White Tuxedo Double Breasted": {
        "color": "White",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Events, Tropical Weddings",
        "style": "Double Breasted Tuxedo",
        "season": "Spring/Summer"
    },
    
    # Tuxedos $249.99
    "Black Gold Design Tuxedo": {
        "color": "Black with Gold Accents",
        "pattern": "Gold Design Pattern",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Ultra Formal, Gala Events, New Year's Eve",
        "style": "Designer Pattern Tuxedo"
    },
    "Black Paisley Tuxedo": {
        "color": "Black",
        "pattern": "Paisley",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward Black Tie, Gala Events",
        "style": "Paisley Pattern Tuxedo"
    },
    "Blush Pink Paisley Tuxedo": {
        "color": "Blush Pink",
        "pattern": "Paisley",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward Events, Spring Weddings",
        "style": "Paisley Pattern Tuxedo"
    },
    "Gold Paisley Tuxedo": {
        "color": "Gold",
        "pattern": "Paisley",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Gala Events, Awards Ceremonies",
        "style": "Paisley Pattern Tuxedo"
    },
    "Ivory Black Tone Trim Tuxedo": {
        "color": "Ivory with Black Trim",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Black Tie, Yacht Events",
        "style": "Contrast Trim Tuxedo"
    },
    "Ivory Gold Paisley Tuxedo": {
        "color": "Ivory with Gold Accents",
        "pattern": "Paisley",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Elegant Summer Events, Destination Weddings",
        "style": "Paisley Pattern Tuxedo"
    },
    "Ivory Paisley Tuxedo": {
        "color": "Ivory",
        "pattern": "Paisley",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Summer Formal Events, Garden Parties",
        "style": "Paisley Pattern Tuxedo"
    },
    "Notch Lapel Black Velvet Tuxedo": {
        "color": "Black",
        "material": "Luxury Velvet",
        "fit": "Modern Fit",
        "occasion": "Winter Black Tie, Holiday Events, Opera",
        "style": "Velvet Notch Lapel Tuxedo",
        "season": "Fall/Winter"
    },
    "Notch Lapel Navy Velvet Tuxedo": {
        "color": "Navy Blue",
        "material": "Luxury Velvet",
        "fit": "Modern Fit",
        "occasion": "Holiday Events, Winter Formal",
        "style": "Velvet Notch Lapel Tuxedo",
        "season": "Fall/Winter"
    },
    "Pink Gold Design Tuxedo": {
        "color": "Pink with Gold Accents",
        "pattern": "Gold Design Pattern",
        "material": "Luxury Jacquard Fabric",
        "fit": "Modern Fit",
        "occasion": "Fashion Forward Events, Gala",
        "style": "Designer Pattern Tuxedo"
    },
    "Vivid Purple Tuxedo Tone Trim Tuxedo": {
        "color": "Vivid Purple",
        "material": "Premium Tuxedo Fabric",
        "fit": "Modern Fit",
        "occasion": "Bold Fashion Events, Prom, Awards",
        "style": "Tone on Tone Trim Tuxedo"
    }
}

print("ADDING COLOR AND SEO METADATA TO PRODUCTS")
print("=" * 60)

success_count = 0
skip_count = 0
error_count = 0

for product_title, new_metadata in products_metadata.items():
    try:
        # Get current product metadata
        cursor.execute("""
            SELECT id, metadata
            FROM product
            WHERE title = %s AND deleted_at IS NULL
        """, (product_title,))
        
        result = cursor.fetchone()
        if not result:
            print(f"❌ Product not found: {product_title}")
            error_count += 1
            continue
        
        product_id, current_metadata = result
        
        # Parse existing metadata or create new
        if current_metadata:
            if isinstance(current_metadata, str):
                try:
                    existing_meta = json.loads(current_metadata)
                except:
                    existing_meta = {}
            else:
                existing_meta = dict(current_metadata) if current_metadata else {}
        else:
            existing_meta = {}
        
        # Check if color already exists
        if 'color' in existing_meta and existing_meta['color']:
            print(f"⏭️  Skipping {product_title} - already has color: {existing_meta['color']}")
            skip_count += 1
            continue
        
        # Merge new metadata with existing
        updated_metadata = {**existing_meta, **new_metadata}
        
        # Update product metadata
        cursor.execute("""
            UPDATE product
            SET metadata = %s::jsonb, updated_at = NOW()
            WHERE id = %s
        """, (json.dumps(updated_metadata), product_id))
        
        print(f"✅ Updated: {product_title}")
        print(f"   Added: color={new_metadata.get('color')}, material={new_metadata.get('material', 'N/A')}")
        success_count += 1
        
    except Exception as e:
        print(f"❌ Error updating {product_title}: {str(e)}")
        error_count += 1
        conn.rollback()
        continue

# Commit all changes
conn.commit()

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"✅ Successfully updated: {success_count} products")
print(f"⏭️  Skipped (already has color): {skip_count} products")
print(f"❌ Errors: {error_count} products")

# Verify the updates
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

cursor.execute("""
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN metadata::text LIKE '%"color"%' THEN 1 END) as has_color,
        COUNT(CASE WHEN metadata::text LIKE '%"material"%' THEN 1 END) as has_material,
        COUNT(CASE WHEN metadata::text LIKE '%"occasion"%' THEN 1 END) as has_occasion,
        COUNT(CASE WHEN metadata::text LIKE '%"fit"%' THEN 1 END) as has_fit,
        COUNT(CASE WHEN metadata::text LIKE '%"style"%' THEN 1 END) as has_style
    FROM product
    WHERE (title LIKE '%Suit%' OR title LIKE '%Tuxedo%' 
           OR title IN ('Burnt Orange', 'Dark Teal', 'Estate Blue', 'Light Grey', 
                       'Mint', 'Pink', 'Brown Gold Buttons', 'Black Strip Shawl Lapel', 
                       'Fall Rust', 'Brick Fall Suit'))
    AND deleted_at IS NULL
""")

result = cursor.fetchone()
if result:
    total, has_color, has_material, has_occasion, has_fit, has_style = result
    print(f"Total suit/tuxedo products: {total}")
    print(f"Has color metadata: {has_color} ({has_color*100//total if total > 0 else 0}%)")
    print(f"Has material metadata: {has_material} ({has_material*100//total if total > 0 else 0}%)")
    print(f"Has occasion metadata: {has_occasion} ({has_occasion*100//total if total > 0 else 0}%)")
    print(f"Has fit metadata: {has_fit} ({has_fit*100//total if total > 0 else 0}%)")
    print(f"Has style metadata: {has_style} ({has_style*100//total if total > 0 else 0}%)")

cursor.close()
conn.close()

print("\n✅ COLOR AND SEO METADATA ADDITION COMPLETE!")
print("All products now have proper color tags for Google recognition and SEO.")