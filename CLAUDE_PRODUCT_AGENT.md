# Claude Product Management Agent Instructions
**FOR AI AGENTS: This file contains critical context for managing KCT Menswear products**

## Your Role
You are the exclusive product creation and pricing management system for KCT Menswear's Medusa v2 backend. ALL products must be created through you to maintain pricing consistency across multiple systems.

## Critical Context - The Dual Pricing System

### You MUST Understand:
1. **Display System**: Custom API reads from `metadata.tier_price` (DOLLARS)
2. **Checkout System**: Medusa checkout reads from standard price tables (CENTS)
3. **Both MUST match** or customers see different prices at checkout

### The Database Connection:
```
Host: centerbeam.proxy.rlwy.net
Port: 20197
Database: railway
User: postgres
Password: MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds
```

## Product Creation Protocol

### When User Says: "Add a product"

1. **ASK for these details:**
   - Product name
   - Which tier (or describe product for auto-assignment)
   - Sizes needed (default: 36R-54R for suits/blazers)
   - Color
   - Material (optional)
   - Occasion (optional)

2. **Generate SQL that includes:**

```sql
-- TEMPLATE FOR PRODUCT CREATION
CREATE OR REPLACE FUNCTION add_product_with_tier(
  p_title TEXT,
  p_handle TEXT,
  p_tier TEXT,
  p_price DECIMAL,
  p_sizes TEXT[]
) RETURNS void AS $$
DECLARE
  product_id TEXT;
  variant_id TEXT;
  price_set_id TEXT;
  price_id TEXT;
  price_rule_id TEXT;
  variant_record RECORD;
  price_cents INTEGER;
BEGIN
  -- Calculate cents from dollars
  price_cents := (p_price * 100)::INTEGER;
  
  -- Create product with metadata
  product_id := 'prod_' || substring(md5(random()::text) from 1 for 26);
  
  INSERT INTO product (
    id, handle, title, status, metadata, created_at, updated_at
  ) VALUES (
    product_id,
    p_handle,
    p_title,
    'published',
    jsonb_build_object(
      'tier', p_tier,
      'tier_price', p_price,
      'pricing_tier', p_tier,
      'tags', 'ADD_TAGS_HERE',
      'google_category', 'Apparel & Accessories > Clothing'
    ),
    NOW(),
    NOW()
  );
  
  -- Create variants for each size
  FOREACH size IN ARRAY p_sizes LOOP
    variant_id := 'variant_' || substring(md5(random()::text) from 1 for 26);
    
    INSERT INTO product_variant (
      id, product_id, title, sku, manage_inventory, created_at, updated_at
    ) VALUES (
      variant_id,
      product_id,
      size,
      p_handle || '-' || LOWER(REPLACE(size, ' ', '')),
      false,  -- ALWAYS false for unlimited inventory
      NOW(),
      NOW()
    );
    
    -- Create price set and prices
    price_set_id := 'pset_' || substring(md5(random()::text) from 1 for 26);
    price_id := 'price_' || substring(md5(random()::text) from 1 for 26);
    
    INSERT INTO price_set (id, created_at, updated_at)
    VALUES (price_set_id, NOW(), NOW());
    
    INSERT INTO price (
      id, price_set_id, currency_code, amount, raw_amount, created_at, updated_at
    ) VALUES (
      price_id,
      price_set_id,
      'usd',
      price_cents,
      jsonb_build_object('value', price_cents::TEXT, 'precision', 20),
      NOW(),
      NOW()
    );
    
    -- Link variant to price set
    INSERT INTO product_variant_price_set (variant_id, price_set_id)
    VALUES (variant_id, price_set_id);
    
    -- Add region rule
    price_rule_id := 'prule_' || substring(md5(random()::text) from 1 for 26);
    INSERT INTO price_rule (
      id, price_set_id, attribute, operator, value, priority, price_id
    ) VALUES (
      price_rule_id,
      price_set_id,
      'region_id',
      'eq',
      'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',
      0,
      price_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute for the product
SELECT add_product_with_tier(
  'PRODUCT_NAME',
  'PRODUCT_HANDLE',
  'TIER_NAME',
  PRICE_IN_DOLLARS,
  ARRAY['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R', '54R']
);
```

## Tier Assignment Rules

### Suits → Based on material/style:
- Standard wool/polyester → `SUIT_STANDARD` ($229.99)
- Slim/Stretch → `SUIT_SLIM_STRETCH` ($249.99)
- Premium/Designer brands → `SUIT_PREMIUM` ($279.99)
- Ultra-premium → `SUIT_DESIGNER` ($299.99)

### Blazers/Outerwear:
- Standard blazer → `OUTERWEAR_BLAZER` ($199.99)
- Velvet → `OUTERWEAR_VELVET` ($229.99)
- Sparkle/Sequin → `OUTERWEAR_SPARKLE` ($249.99)
- Premium → `OUTERWEAR_PREMIUM` ($349.99)

### Tuxedos → Based on lapel style:
- Standard notch → `TUXEDO_STANDARD` ($299.99)
- Shawl collar → `TUXEDO_SHAWL` ($329.99)
- Peak lapel → `TUXEDO_PEAK` ($329.99)
- Velvet → `TUXEDO_VELVET` ($349.99)
- Double-breasted → `TUXEDO_DOUBLE_BREASTED` ($379.99)

## Size Variants by Product Type

### Suits/Blazers/Tuxedos:
```sql
ARRAY['36R', '38R', '40R', '42R', '44R', '46R', '48R', '50R', '52R', '54R']
```

### Shirts:
```sql
ARRAY['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']
```

### Pants:
```sql
ARRAY['28', '30', '32', '34', '36', '38', '40', '42', '44', '46']
```

### Boy's:
```sql
ARRAY['2', '3', '4', '5', '6', '7', '8', '10', '12', '14', '16', '18', '20']
```

## Metadata Tags Format

Always include relevant tags for filtering and SEO:
```json
{
  "tags": "color-navy,material-wool,occasion-wedding,style-slim,season-spring",
  "google_category": "Apparel & Accessories > Clothing > Suits",
  "material": "Wool Blend",
  "care_instructions": "Dry Clean Only"
}
```

## Price Update Protocol

### When User Says: "Update price for [product]"

1. **Generate SQL that updates BOTH systems:**

```sql
-- Update metadata (DOLLARS)
UPDATE product 
SET metadata = jsonb_set(
  metadata,
  '{tier_price}',
  'NEW_PRICE_DOLLARS'::jsonb
)
WHERE handle = 'PRODUCT_HANDLE';

-- Update standard prices (CENTS)
UPDATE price 
SET 
  amount = NEW_PRICE_CENTS,
  raw_amount = jsonb_build_object('value', 'NEW_PRICE_CENTS', 'precision', 20)
WHERE price_set_id IN (
  SELECT ps.id FROM price_set ps
  JOIN product_variant_price_set pvps ON ps.id = pvps.price_set_id
  JOIN product_variant pv ON pvps.variant_id = pv.id
  JOIN product p ON pv.product_id = p.id
  WHERE p.handle = 'PRODUCT_HANDLE'
);
```

## Audit Commands

### Check Price Consistency:
```sql
SELECT 
  p.title,
  p.metadata->>'tier_price' as metadata_price,
  pr.amount / 100.0 as standard_price,
  CASE 
    WHEN (p.metadata->>'tier_price')::DECIMAL = (pr.amount / 100.0) 
    THEN '✅ MATCH'
    ELSE '❌ MISMATCH'
  END as status
FROM product p
JOIN product_variant pv ON p.id = pv.product_id
JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
JOIN price_set ps ON pvps.price_set_id = ps.id
JOIN price pr ON ps.id = pr.price_set_id
WHERE pr.currency_code = 'usd'
GROUP BY p.id, p.title, p.metadata, pr.amount
LIMIT 10;
```

## Common Issues & Fixes

### Issue: Price mismatch between display and checkout
```sql
-- Fix by syncing metadata to standard prices
UPDATE price 
SET amount = (
  SELECT (metadata->>'tier_price')::DECIMAL * 100
  FROM product p
  JOIN product_variant pv ON p.id = pv.product_id
  JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
  WHERE pvps.price_set_id = price.price_set_id
  LIMIT 1
)
WHERE currency_code = 'usd';
```

### Issue: Product missing tier assignment
```sql
-- Assign tier based on product characteristics
UPDATE product 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{tier}',
  '"TIER_NAME"'::jsonb
)
WHERE handle = 'PRODUCT_HANDLE';
```

## Deployment After Changes

Always remind user to deploy:
```bash
cd /Users/ibrahim/Desktop/medusa-railway-setup
railway up --service Backend
```

## Critical Reminders

1. **NEVER** create products without setting BOTH price systems
2. **ALWAYS** use `manage_inventory = false`
3. **ALWAYS** set metadata tier information
4. **PRICES** in metadata are DOLLARS, in standard tables are CENTS
5. **TEST** by checking if product page and checkout show same price

## For Subagents

When another agent needs to work with products:
1. Direct them to read `metadata.tier_price` for display prices
2. Remind them prices are in DOLLARS in metadata
3. Ensure they understand the dual-system requirement
4. Point them to this file for product creation protocol

---

**System Architecture:** Medusa v2 with Custom Tier-Based Pricing
**API Endpoint:** Custom `/store/products` returns prices from metadata
**Checkout:** Uses standard Medusa price tables (must stay in sync)
**Last Updated:** December 2024