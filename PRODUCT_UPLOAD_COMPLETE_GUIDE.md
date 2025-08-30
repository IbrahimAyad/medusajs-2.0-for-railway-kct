# Complete Product Upload Guide for Medusa 2.0 + Railway + PostgreSQL

## Context & Background
This guide documents the WORKING method to upload products to Medusa 2.0 deployed on Railway. The CSV import feature in Medusa 2.0 is broken (accepts files but doesn't persist products), so we use direct PostgreSQL database insertion.

## Critical Information
- **Project**: KCT Menswear - Men's suits and formal wear
- **Deployment**: Railway platform
- **Database**: PostgreSQL (Railway managed)
- **Admin Panel**: https://backend-production-7441.up.railway.app/app
- **Sales Channel**: "KCT Menswear"
- **Product Types**: Suits, Tuxedos, Business, Formal, Wedding, Prom

## Database Connection Details
```bash
Host: centerbeam.proxy.rlwy.net
Port: 20197
Database: railway
Username: postgres
Password: MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds
```

## Why Direct SQL Instead of Medusa's Methods

### What DOESN'T Work:
1. **CSV Import** - Has a two-phase process that fails silently in phase 2
   - Error: "Transaction not found"
   - Products appear to import but don't persist
2. **importProductsWorkflow** - Requires confirmation that fails
3. **API endpoints** - Need authentication and have service resolution issues

### What DOES Work:
**Direct PostgreSQL insertion** - Bypasses all Medusa workflows and directly inserts into database

## Step-by-Step Product Upload Process

### Step 1: Prepare Product Data
Gather the following information for each product:
- Product title
- Handle (URL slug)
- Description
- SKU base (e.g., M341SK-04)
- Images (Shopify CDN URLs work best)
- Sizes (Regular: 34R-56R, Short: 34S-46S, Long: 38L-56L)
- Price
- Inventory status per size

### Step 2: Create SQL Insert Script

Create a file like `import-products.sql`:

```sql
-- COMPLETE PRODUCT IMPORT TEMPLATE
-- Replace values with your actual product data

-- Insert Product
INSERT INTO product (
    id,
    handle,
    title,
    subtitle,
    description,
    status,
    thumbnail,
    is_giftcard,
    metadata,
    created_at,
    updated_at
) VALUES (
    'prod_' || substr(gen_random_uuid()::text, 1, 16),  -- Auto-generate ID
    'your-product-handle',                               -- URL-friendly handle
    'Your Product Title',                                -- Display title
    'Collection Name',                                   -- Subtitle/collection
    'Full product description here',                     -- Description
    'published',                                         -- Status (published/draft)
    'https://cdn.shopify.com/your-image.jpg',           -- Main image URL
    false,                                              -- Not a gift card
    jsonb_build_object(                                 -- Metadata
        'sku_base', 'SKU-BASE',
        'vendor', 'Vendor Name',
        'style', 'Style Code',
        'price', 299.99,
        'images', json_build_array(
            'https://image1.jpg',
            'https://image2.jpg',
            'https://image3.jpg'
        )
    ),
    NOW(),
    NOW()
);

-- Get the product ID for variants
DO $$
DECLARE
    prod_id TEXT;
BEGIN
    SELECT id INTO prod_id FROM product 
    WHERE handle = 'your-product-handle'
    LIMIT 1;
    
    -- Add Regular sizes (34R-56R)
    INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, allow_backorder, metadata, created_at, updated_at)
    SELECT 
        'var_' || substr(gen_random_uuid()::text, 1, 8),
        prod_id,
        size || 'R',
        'SKU-BASE-' || size || 'R',
        true,
        false,
        jsonb_build_object(
            'size', size || 'R',
            'in_stock', true  -- Set false for out of stock sizes
        ),
        NOW(),
        NOW()
    FROM generate_series(34, 56, 2) AS size;
    
    -- Add Short sizes (34S-46S)
    INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, allow_backorder, metadata, created_at, updated_at)
    SELECT 
        'var_' || substr(gen_random_uuid()::text, 1, 8),
        prod_id,
        size || 'S',
        'SKU-BASE-' || size || 'S',
        true,
        false,
        jsonb_build_object(
            'size', size || 'S',
            'in_stock', true
        ),
        NOW(),
        NOW()
    FROM generate_series(34, 46, 2) AS size;
    
    -- Add Long sizes (38L-56L)
    INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, allow_backorder, metadata, created_at, updated_at)
    SELECT 
        'var_' || substr(gen_random_uuid()::text, 1, 8),
        prod_id,
        size || 'L',
        'SKU-BASE-' || size || 'L',
        true,
        false,
        jsonb_build_object(
            'size', size || 'L',
            'in_stock', true
        ),
        NOW(),
        NOW()
    FROM generate_series(38, 56, 2) AS size;
    
    -- Link to KCT Menswear sales channel
    INSERT INTO product_sales_channel (id, product_id, sales_channel_id, created_at, updated_at)
    SELECT 
        'psc_' || substr(gen_random_uuid()::text, 1, 16),
        prod_id,
        sc.id,
        NOW(),
        NOW()
    FROM sales_channel sc
    WHERE sc.name = 'KCT Menswear';
    
END $$;
```

### Step 3: Execute SQL Import

Run the SQL file using one of these methods:

#### Method A: Direct psql command
```bash
PGPASSWORD="MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds" \
psql -h centerbeam.proxy.rlwy.net -p 20197 -U postgres -d railway \
-f import-products.sql
```

#### Method B: Railway CLI
```bash
cd backend
railway run --service Backend psql $DATABASE_URL < import-products.sql
```

### Step 4: Handle Product Images

Medusa doesn't have a dedicated product_images table by default. Images are stored in the product metadata. To update images:

```sql
UPDATE product 
SET 
    thumbnail = 'https://main-image-url.jpg',
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{images}',
        json_build_array(
            'https://image1.jpg',
            'https://image2.jpg',
            'https://image3.jpg',
            'https://image4.jpg'
        )::jsonb
    )
WHERE handle = 'your-product-handle';
```

### Step 5: Set Inventory Status

Mark specific sizes as out of stock:

```sql
UPDATE product_variant
SET 
    metadata = jsonb_set(
        COALESCE(metadata, '{}'::jsonb),
        '{in_stock}',
        CASE 
            WHEN sku IN ('SKU-34R', 'SKU-36S', 'SKU-50L') THEN 'false'::jsonb
            ELSE 'true'::jsonb
        END
    )
WHERE product_id = (SELECT id FROM product WHERE handle = 'your-product-handle');
```

## Real Example: M341SK-04 Suit

Here's the actual SQL used to import the Ivory/Burgundy Satin Shawl Collar Suit:

```sql
-- Product with 29 size variants
UPDATE product 
SET 
    title = '2 PC Satin Shawl Collar Suit - Ivory/Burgundy',
    subtitle = 'Style: M341SK-04',
    description = 'Elegant ivory suit with burgundy satin shawl collar vest.',
    thumbnail = 'https://cdn.shopify.com/s/files/1/0893/7976/6585/products/M341SK-04_1.jpg',
    metadata = jsonb_build_object(
        'sku_base', 'M341SK-04',
        'color', 'Ivory/Burgundy Shawl',
        'vendor', 'Tazzio',
        'style', 'M341SK-04',
        'price', 174.99,
        'images', json_build_array(
            'https://cdn.shopify.com/s/files/1/0893/7976/6585/products/M341SK-04_1.jpg',
            'https://cdn.shopify.com/s/files/1/0893/7976/6585/products/M341SK-04_2.jpg',
            'https://cdn.shopify.com/s/files/1/0893/7976/6585/products/M341SK-04_3.jpg',
            'https://cdn.shopify.com/s/files/1/0893/7976/6585/products/M341SK-04_4.jpg'
        )
    )
WHERE id = 'prod_burgundy_da8df09f';
```

## Verification Queries

After import, verify your products:

```sql
-- Check products
SELECT handle, title, status, created_at 
FROM product 
ORDER BY created_at DESC 
LIMIT 10;

-- Count variants per product
SELECT 
    p.title,
    COUNT(pv.id) as variant_count,
    COUNT(CASE WHEN (pv.metadata->>'in_stock')::boolean THEN 1 END) as in_stock
FROM product p
LEFT JOIN product_variant pv ON pv.product_id = p.id
GROUP BY p.id, p.title;

-- Check sales channel assignment
SELECT 
    p.title,
    sc.name as sales_channel
FROM product p
JOIN product_sales_channel psc ON psc.product_id = p.id
JOIN sales_channel sc ON sc.id = psc.sales_channel_id;
```

## Step 6: Fix Inventory (CRITICAL)

Products will show 0 inventory until properly linked to inventory system:

```sql
-- 1. Create inventory items for all variants
INSERT INTO inventory_item (id, sku, created_at, updated_at)
SELECT DISTINCT
    'invitem_' || substr(gen_random_uuid()::text, 1, 16),
    pv.sku,
    NOW(),
    NOW()
FROM product_variant pv
JOIN product p ON p.id = pv.product_id
WHERE p.status = 'published'
AND pv.sku IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM inventory_item ii
    WHERE ii.sku = pv.sku
);

-- 2. Set inventory levels at stock location
INSERT INTO inventory_level (
    id,
    inventory_item_id,
    location_id,
    stocked_quantity,
    reserved_quantity,
    incoming_quantity,
    created_at,
    updated_at
)
SELECT 
    'invlvl_' || substr(gen_random_uuid()::text, 1, 16),
    ii.id,
    'sloc_01K3RYPKMN8VRRHMZ890XXVWP5',  -- Kalamazoo location
    10,  -- Default quantity (adjust as needed)
    0,
    0,
    NOW(),
    NOW()
FROM inventory_item ii
WHERE NOT EXISTS (
    SELECT 1 FROM inventory_level il
    WHERE il.inventory_item_id = ii.id
    AND il.location_id = 'sloc_01K3RYPKMN8VRRHMZ890XXVWP5'
);

-- 3. Link variants to inventory items
INSERT INTO product_variant_inventory_item (
    id,
    variant_id,
    inventory_item_id,
    required_quantity,
    created_at,
    updated_at
)
SELECT 
    'pvii_' || substr(gen_random_uuid()::text, 1, 16),
    pv.id,
    ii.id,
    1,
    NOW(),
    NOW()
FROM product_variant pv
JOIN inventory_item ii ON ii.sku = pv.sku
WHERE NOT EXISTS (
    SELECT 1 FROM product_variant_inventory_item pvii
    WHERE pvii.variant_id = pv.id
    AND pvii.inventory_item_id = ii.id
);
```

## Troubleshooting

### Images Not Loading
- Ensure URLs are publicly accessible
- Use HTTPS URLs only
- Shopify CDN URLs work best: `https://cdn.shopify.com/s/files/...`

### Products Not Showing in Admin
1. Check sales channel assignment
2. Verify status is 'published'
3. Clear browser cache and refresh

### Inventory Shows 0 (Most Common Issue)
1. Products must be linked to shipping profile (already done)
2. Create inventory items for each variant
3. Set inventory levels at stock location
4. Link variants to inventory items via junction table
5. Run the SQL in Step 6 above

### Duplicate Handle Error
```sql
-- Check for existing handles
SELECT id, handle FROM product WHERE handle = 'your-handle';

-- Update existing instead of insert
UPDATE product SET ... WHERE handle = 'existing-handle';
```

### Variants Not Showing
Ensure variants are linked to product:
```sql
SELECT COUNT(*) FROM product_variant WHERE product_id = 'your-product-id';
```

## Database Schema Reference

### product table
- `id` (text, primary key)
- `handle` (text, unique)
- `title` (text, required)
- `subtitle` (text)
- `description` (text)
- `status` (text: 'published'/'draft')
- `thumbnail` (text - main image URL)
- `metadata` (jsonb - stores additional data like images array)
- `is_giftcard` (boolean, default false)

### product_variant table
- `id` (text, primary key)
- `product_id` (text, foreign key)
- `title` (text - size like "38R")
- `sku` (text - unique identifier)
- `manage_inventory` (boolean)
- `allow_backorder` (boolean)
- `metadata` (jsonb - stores in_stock status, prices, etc.)

### product_sales_channel table
- `id` (text, primary key)
- `product_id` (text)
- `sales_channel_id` (text)

## Bulk Import Strategy

For 250+ products:

1. Create a master SQL file with all products
2. Use transactions to ensure atomicity:
```sql
BEGIN;
-- All your INSERT statements
COMMIT;
```

3. Or create separate files by category:
- `import-suits.sql`
- `import-tuxedos.sql`
- `import-accessories.sql`

## Important Notes for Other Claude Instances

1. **DO NOT use CSV import** - it's broken in Medusa 2.0
2. **DO NOT use importProductsWorkflow** - confirmation fails
3. **DO use direct PostgreSQL** - this is the only reliable method
4. **Sales Channel Required** - products must be linked to "KCT Menswear"
5. **Metadata is Key** - store images, prices, and inventory status in metadata
6. **Generate IDs** - use `gen_random_uuid()` for automatic ID generation
7. **Size Variants** - menswear requires extensive size ranges (up to 29 variants per product)

## Quick Reference Commands

```bash
# Connect to database
PGPASSWORD="MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds" psql -h centerbeam.proxy.rlwy.net -p 20197 -U postgres -d railway

# Import products
psql -f your-import.sql

# Check products
-c "SELECT COUNT(*) FROM product WHERE status = 'published';"

# Check variants
-c "SELECT COUNT(*) FROM product_variant;"
```

## Files in Project
- `/backend/` - Medusa backend
- `direct-sql-import.sql` - Example import file
- `fix-m341sk-04.sql` - Real product update example
- `WORKING_IMPORT.sql` - Tested import template

---
**Last Updated**: August 30, 2025
**Tested With**: Medusa 2.0, Railway, PostgreSQL
**Status**: ✅ WORKING METHOD