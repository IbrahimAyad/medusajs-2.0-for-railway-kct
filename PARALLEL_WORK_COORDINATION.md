# Parallel Work Coordination - Product & Variant Fix
## Date: September 6, 2025

## ⚠️ CRITICAL: READ BEFORE STARTING ANY WORK

### Database Connection
```
Host: centerbeam.proxy.rlwy.net
Port: 20197
User: postgres
Password: MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds
Database: railway
```

### Required for ALL Variants (Every Instance Must Do This)
1. Set `manage_inventory = false` on ALL variants
2. Ensure `product_variant_price_set` link exists and `deleted_at IS NULL`
3. Create price in `price` table with correct amount
4. Add `price_rule` for region 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD' (US)
5. Currency code must be lowercase 'usd'
6. Raw_amount must be JSON: `{"value": "[amount]", "precision": 20}`

---

## INSTANCE 1: Suits & Tuxedos
**File Owner**: Claude Instance 1
**Status**: [ ] Not Started [ ] In Progress [X] Complete

### A. Regular Suits (29 products found) - $229.99
**Required Sizes**: 36R-54R (Regular) AND 38L-54L (Long) = 19 variants each

Products fixed:
- [X] 2 PC Double Breasted Solid Suit
- [X] 2 PC Satin Shawl Collar Suit - Ivory/Burgundy
- [X] Black Pinstripe Shawl Lapel Double-Breasted Suit
- [X] Black Strip Shawl Lapel
- [X] Black Suit
- [X] Brown Gold Buttons
- [X] Brown Suit
- [X] Burnt Orange
- [X] Classic Navy Suit
- [X] Classic Navy Two-Piece Suit
- [X] Dark Teal
- [X] Estate Blue
- [X] Fall Forest Green Mocha Double Breasted Suit
- [X] Fall Mocha Double Breasted Suit
- [X] Fall Rust
- [X] Fall Smoked Blue Double Breasted Suit
- [X] Forest Green Mocha Double-Breasted Suit
- [X] Light Grey
- [X] Mint
- [X] Navy Blue Performance Stretch Suit
- [X] Navy Suit
- [X] Pin Stripe Black
- [X] Pin Stripe Brown
- [X] Pin Stripe Canyon Clay Double Breasted Suit
- [X] Pin Stripe Grey
- [X] Pin Stripe Navy
- [X] Pink
- [X] Brick Fall Suit
- [X] Satin Shawl Collar Suit (additional found)

### B. Tuxedos (26 products found) - Various Prices
**Required Sizes**: 36R-54R (Regular) AND 38L-54L (Long) = 19 variants each

#### $199.99 Tuxedos (Fixed):
- [X] Black On Black Slim Tuxedo Tone Trim Tuxedo
- [X] Black Tuxedo
- [X] Blush Tuxedo
- [X] Burnt Orange Tuxedo
- [X] Classic Black Tuxedo with Satin Lapels
- [X] Hunter Green Tuxedo
- [X] Light Grey On Light Grey Slim Tuxedo Tone Trim Tuxedo
- [X] Navy Tone Trim Tuxedo
- [X] Sand Tuxedo
- [X] Tan Tuxedo Double Breasted
- [X] Wine On Wine Slim Tuxedotone Trim Tuxedo
- [X] Black Tuxedo with Satin Lapels (additional found)

#### $229.99 Tuxedos (Fixed):
- [X] Black Tone Trim Tuxedo Shawl Lapel
- [X] Red Tuxedo Double Breasted
- [X] White Black Tuxedo
- [X] White Tuxedo Double Breasted

#### $249.99 Tuxedos (Fixed):
- [X] Black Gold Design Tuxedo
- [X] Black Paisley Tuxedo
- [X] Blush Pink Paisley Tuxedo
- [X] Gold Paisley Tuxedo
- [X] Ivory Black Tone Trim Tuxedo
- [X] Ivory Gold Paisley Tuxedo
- [X] Ivory Paisley Tuxedo
- [X] Notch Lapel Black Velvet Tuxedo
- [X] Notch Lapel Navy Velvet Tuxedo
- [X] Pink Gold Design Tuxedo
- [X] Vivid Purple Tuxedo Tone Trim Tuxedo

**Progress Tracking**:
- [X] Deleted old incorrect variants
- [X] Created new variants with correct sizes
- [X] Applied correct pricing
- [X] Set manage_inventory = false
- [X] Verified checkout works

**Completion Details**:
- Completed: September 7, 2025
- Total products fixed: 55 (29 Regular Suits + 26 Tuxedos)
- All products have 19 variants (36R-54R Regular + 38L-54L Long)
- All have manage_inventory = false
- Regular Suits priced at $229.99
- Tuxedos priced at $199.99, $229.99, or $249.99 as specified
- All pricing verified and checkout tested

---

## INSTANCE 2: Slim/Stretch & Velvet
**File Owner**: Claude Instance 2
**Status**: [ ] Not Started [ ] In Progress [X] Complete

### A. Slim/Stretch Suits (9 products) - $249.99
**Required Sizes**: 36R-54R = 10 variants each

Products to fix:
- [X] Beige Slim Stretch
- [X] Black Slim Stretch
- [X] Burgundy Slim Stretch
- [X] Light Grey Slim Stretch
- [X] Mauve Slim Stretch
- [X] Mint Slim Stretch
- [X] Pink Slim Stretch
- [X] Salmon Slim Stretch
- [X] Tan Slim Stretch

### B. Velvet Jackets/Blazers (28 products found) - $229.99
**Required Sizes**: 36R-54R = 10 variants each

Products fixed:
- [X] Men's All Navy Velvet Blazer
- [X] Men's All Navy Velvet Jacker
- [X] Men's All Red Velvet Jacker
- [X] Men's Black Paisley Pattern Velvet Blazer
- [X] Men's Black Velvet Blazer Shawl Lapel
- [X] Men's Black Velvet Jacket
- [X] Men's Brown Velvet Blazer With Bowtie
- [X] Men's Cherry Red Velvet Blazer
- [X] Men's Dark Burgundy Velvet Blazer
- [X] Men's Euro Burgundy Velvet Blazer
- [X] Men's Green Paisley Pattern Velvet Blazer
- [X] Men's Green Velvet Blazer
- [X] Men's Green Velvet Blazer With Bowtie
- [X] Men's Hunter Green Velvet Blazer
- [X] Men's Navy Velvet Blazer
- [X] Men's Navy Velvet Blazer 2025
- [X] Men's Notch Lapel Burgundy Velvet Blazer
- [X] Men's Pink Velvet Blazer
- [X] Men's Purple Velvet Blazer
- [X] Men's Purple Velvet Blazer With Bowtie
- [X] Men's Royal Blue Velvet Blazer
- [X] Men's Red Paisley Pattern Velvet Blazer (found in DB)
- [X] Men's Red Velvet Blazer With Bowtie (found in DB)
- [X] Men's Royal Blue Paisley Pattern Velvet Blazer (found in DB)
- [X] Men's Royal Blue Velvet Blazer With Bowtie (found in DB)
- [X] Men's White Velvet Blazer (found in DB)
- [X] Men's Wine Velvet Blazer
- [X] Premium Velvet Blazer - Midnight Navy (found in DB)

Note: Silver, Taupe, Teal, White Paisley, Wine Paisley, Olive, Purple Paisley, and Red Velvet Blazer not found in database

**Progress Tracking**:
- [X] Deleted old incorrect variants
- [X] Created new variants with correct sizes
- [X] Applied correct pricing
- [X] Set manage_inventory = false
- [X] Verified checkout works

**Completion Details**:
- Completed: September 7, 2025
- Total products fixed: 37 (9 Slim/Stretch + 28 Velvet)
- All variants have 10 sizes (36R-54R)
- All have manage_inventory = false
- Slim/Stretch priced at $249.99
- Velvet priced at $229.99
- Checkout tested and working

---

## INSTANCE 3: Boys, Accessories & Shirts
**File Owner**: Claude Instance 3
**Status**: [ ] Not Started [ ] In Progress [X] Complete

### A. Boys Suits (9 products) - $149.99
**Required Sizes**: 2, 4, 6, 8, 10, 12, 14, 16 = 8 variants each

Products fixed:
- [X] Mid Tan Stacy Adams Boy's 5pc Solid Suit
- [X] Stacy Adams Boy's 5pc Solid Suit - Black
- [X] Stacy Adams Boy's 5pc Solid Suit - Burgundy
- [X] Stacy Adams Boy's 5pc Solid Suit - Charcoal Grey
- [X] Stacy Adams Boy's 5pc Solid Suit - Grey
- [X] Stacy Adams Boy's 5pc Solid Suit - Indigo
- [X] Stacy Adams Boy's 5pc Solid Suit - Mid Grey
- [X] Stacy Adams Boy's 5pc Solid Suit - Red
- [X] Stacy Adams Boy's 5pc Solid Suit - White

### B. Suspenders/Accessories - Various Prices
**Required Sizes**: One size only

#### Suspender Bowtie Sets - $49.99:
- [X] Black Suspender Bowtie Set
- [X] Burnt Orange Suspender Bowtie Set
- [X] Dusty Rose Suspender Bowtie Set
- [X] Fuchsia Suspender Bowtie Set
- [X] Gold Suspender Bowtie Set
- [X] Hunter Green Suspender Bowtie Set
- [X] Powder Blue Suspender Bowtie Set
- [X] Brown Suspender Bowtie Set (additional found)
- [X] Medium Red Suspender Bowtie Set (additional found)
- [X] Orange Suspender Bowtie Set (additional found)

#### Suspenders Only - $34.99:
- [X] Black Suspenders
- [X] Navy Suspenders

### C. Dress Shirts
**Required Sizes**: S, M, L, XL, XXL (2XL) = 5 variants each

#### Collarless Shirts - $59.99:
- [X] Black Collarless Dress Shirt
- [X] Light Blue Collarless Dress Shirt
- [X] White Collarless Dress Shirt

#### Ultra Stretch Shirts - $69.99:
- [X] Black Ultra Stretch Dress Shirt
- [ ] White Ultra Stretch Dress Shirt (not found in database)
- [ ] Light Blue Ultra Stretch Dress Shirt (not found in database)

**Progress Tracking**:
- [X] Deleted old incorrect variants (especially boys with adult sizes!)
- [X] Created new variants with correct sizes
- [X] Applied correct pricing
- [X] Set manage_inventory = false
- [X] Verified checkout works

**Completion Details**:
- Completed: September 7, 2025
- Total products fixed: 25
  - 9 Boys Suits (8 variants each, sizes 2-16)
  - 12 Suspenders/Accessories (1 variant each, One Size)
  - 4 Dress Shirts (5 variants each, S-XXL)
- All have manage_inventory = false
- Boys Suits priced at $149.99
- Suspender Bowtie Sets priced at $49.99
- Suspenders Only priced at $34.99
- Collarless Shirts priced at $59.99
- Ultra Stretch Shirts priced at $69.99
- All pricing verified and checkout tested

---

## COORDINATION RULES

1. **DO NOT** touch products assigned to other instances
2. **ALWAYS** set `manage_inventory = false`
3. **ALWAYS** use lowercase 'usd' for currency
4. **CHECK** this file before starting - another instance may have updated
5. **UPDATE** your progress checkboxes as you work
6. **TEST** at least one product from each category before marking complete

## SQL Templates for Reference

### Delete Old Variants
```sql
DELETE FROM product_variant 
WHERE product_id = '[PRODUCT_ID]' 
AND title NOT IN ('36R', '38R', '40R', etc...);
```

### Create New Variant
```sql
INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, created_at, updated_at)
VALUES (
    'variant_' || gen_random_uuid(),
    '[PRODUCT_ID]',
    '36R',
    '[SKU]',
    false,
    NOW(),
    NOW()
);
```

### Add Price to Variant
```sql
-- Create price set if needed
INSERT INTO price_set (id, created_at, updated_at)
VALUES ('pset_' || gen_random_uuid(), NOW(), NOW());

-- Link variant to price set
INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
VALUES ('pvps_' || gen_random_uuid(), '[VARIANT_ID]', '[PRICE_SET_ID]', NOW(), NOW());

-- Add price
INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, created_at, updated_at)
VALUES (
    'price_' || gen_random_uuid(),
    '[PRICE_SET_ID]',
    'usd',
    22999, -- $229.99 in cents
    '{"value": "22999", "precision": 20}'::jsonb,
    NOW(),
    NOW()
);

-- Add region rule
INSERT INTO price_rule (id, value, priority, price_id, attribute, operator, created_at, updated_at)
VALUES (
    'prule_' || gen_random_uuid(),
    'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',
    0,
    '[PRICE_ID]',
    'region_id',
    'eq',
    NOW(),
    NOW()
);
```

## Status Summary
- Instance 1: ✅ 55 products COMPLETE (29 Regular Suits + 26 Tuxedos)
- Instance 2: ✅ 37 products COMPLETE (9 Slim/Stretch + 28 Velvet)
- Instance 3: ✅ 25 products COMPLETE (9 Boys + 12 Accessories + 4 Shirts)

## Final Checklist
- [X] All instances complete
- [X] All products have correct variants
- [X] All prices are correct
- [X] All variants have manage_inventory = false
- [X] Checkout tested for each category
- [X] This document updated with final status

## Summary of Work Completed
- **Total Products Fixed**: 117 products across all instances
- **Total Variants Created**: ~1,500+ variants with correct sizing
- **All Pricing Applied**: Correct pricing for each category
- **Inventory Management**: All set to false (not tracking inventory)
- **Testing**: Checkout verified for sample products in each category

---
**Last Updated**: September 7, 2025
**Coordinator**: Main Claude Instance
**All Instances**: COMPLETE ✅