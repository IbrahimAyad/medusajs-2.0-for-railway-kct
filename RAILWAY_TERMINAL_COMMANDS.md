# Railway Terminal Commands for Product Import

Since the Medusa admin UI has bugs (DialogTitle errors), use these commands directly in Railway's Web Terminal.

## Step 1: Open Railway Web Terminal

1. Go to Railway Dashboard
2. Click on **Backend** service
3. Click **Connect** → **Web Terminal** or **Railway CLI**

## Step 2: Run These Commands

### Quick Test - Add One Product
```bash
psql $DATABASE_URL << 'EOF'
INSERT INTO product (id, handle, title, subtitle, description, status, thumbnail, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'test-charcoal-suit', 
  '2 PC Double Breasted Solid Suit', 
  'Tazzio Collection',
  'Versatile charcoal gray double-breasted suit', 
  'published', 
  'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg',
  NOW(), 
  NOW()
);
EOF
```

### Full Import - Add Multiple Products with Variants
```bash
psql $DATABASE_URL << 'EOF'
-- Add Products
INSERT INTO product (id, handle, title, subtitle, description, status, thumbnail, metadata, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'charcoal-suit-m404', '2 PC Double Breasted Solid Suit', 'Tazzio Collection', 
   'Versatile charcoal gray double-breasted suit perfect for business', 'published',
   'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg',
   '{"vendor": "Tazzio", "sku_base": "M404SK-03"}'::jsonb, NOW(), NOW()),
   
  (gen_random_uuid(), 'burgundy-suit-m341', '2 PC Satin Shawl Collar Suit', 'Tazzio Tuxedo', 
   'Rich burgundy suit with satin shawl collar', 'published',
   'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg',
   '{"vendor": "Tazzio", "sku_base": "M341SK-06"}'::jsonb, NOW(), NOW()),
   
  (gen_random_uuid(), 'navy-business-suit', 'Classic Navy Two-Piece Suit', 'Premium Collection', 
   'Timeless navy blue suit for professionals', 'published',
   'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/navy-suit.jpg',
   '{"vendor": "KCT Premium"}'::jsonb, NOW(), NOW()),
   
  (gen_random_uuid(), 'black-tuxedo-formal', 'Black Tuxedo with Satin Lapels', 'Executive', 
   'Elegant black tuxedo for formal events', 'published',
   'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/tuxedo.jpg',
   '{"vendor": "KCT Formal"}'::jsonb, NOW(), NOW())
ON CONFLICT (handle) DO NOTHING;

-- Add Variants with Sizes
INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, inventory_quantity, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  p.title || ' - Size ' || s.size,
  UPPER(REPLACE(p.handle, '-', '')) || '-' || s.size,
  true,
  CASE 
    WHEN s.size IN ('40R', '42R') THEN 15  -- Popular sizes
    WHEN s.size IN ('38R', '44R') THEN 10  -- Common sizes
    ELSE 5  -- Less common sizes
  END,
  NOW(),
  NOW()
FROM product p
CROSS JOIN (
  VALUES ('36S'), ('36R'), ('38S'), ('38R'), ('38L'), 
         ('40S'), ('40R'), ('40L'), ('42S'), ('42R'), 
         ('42L'), ('44R'), ('44L'), ('46R')
) AS s(size)
WHERE p.handle IN ('charcoal-suit-m404', 'burgundy-suit-m341', 'navy-business-suit', 'black-tuxedo-formal')
ON CONFLICT (sku) DO NOTHING;

-- Link to Sales Channel (KCT Menswear)
INSERT INTO product_sales_channel (product_id, sales_channel_id)
SELECT p.id, sc.id
FROM product p
CROSS JOIN sales_channel sc
WHERE p.handle IN ('charcoal-suit-m404', 'burgundy-suit-m341', 'navy-business-suit', 'black-tuxedo-formal')
  AND sc.name = 'KCT Menswear'
ON CONFLICT DO NOTHING;

-- Verify Import
SELECT p.handle, p.title, COUNT(pv.id) as variant_count
FROM product p
LEFT JOIN product_variant pv ON pv.product_id = p.id
WHERE p.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY p.id, p.handle, p.title;
EOF
```

### Check What Was Imported
```bash
psql $DATABASE_URL -c "SELECT handle, title, status FROM product ORDER BY created_at DESC LIMIT 10;"
```

### Count Products and Variants
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as product_count FROM product WHERE status = 'published';"
psql $DATABASE_URL -c "SELECT COUNT(*) as variant_count FROM product_variant;"
```

## Step 3: Verify in Admin Panel

1. Go to https://backend-production-7441.up.railway.app/app
2. Navigate to Products
3. Products should now be visible!

## If Products Don't Appear

Clear cache and refresh:
```bash
# Restart the backend service
railway restart --service Backend
```

Or manually link to sales channel:
```bash
psql $DATABASE_URL -c "UPDATE product SET status = 'published' WHERE status IS NULL;"
```

## Notes
- The DialogTitle errors in the UI are a Medusa bug
- Direct database insertion bypasses these UI issues
- Products will appear immediately after running these commands