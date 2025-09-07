# KCT Menswear Product & Pricing Discipline Guide
**CRITICAL: This document defines the ONLY approved method for adding products to ensure pricing consistency**

## ⚠️ The Problem We're Solving
We have THREE pricing systems that must stay synchronized:
1. **Display Prices**: `metadata.tier_price` in DOLLARS (e.g., 229.99)
2. **Medusa Checkout**: Standard price tables in CENTS (e.g., 22999)
3. **Stripe Integration**: `metadata.stripe_price_id` for direct checkout

**If these don't match, customers see different prices between product pages and checkout = lost sales**

## ✅ The Solution: Claude-Enforced Product Creation

### The New Rule:
**ALL new products MUST be added through Claude Code to guarantee consistency**

### Why This Works:
- Claude automatically sets BOTH pricing systems correctly
- No human error in price conversion (dollars vs cents)
- Consistent tier assignment
- Guaranteed checkout compatibility

## 📋 The 45-Tier Pricing Structure

### Suits (6 tiers)
- `SUIT_BUDGET`: $199.99
- `SUIT_STANDARD`: $229.99
- `SUIT_PREMIUM`: $279.99
- `SUIT_DESIGNER`: $299.99
- `SUIT_SLIM_STRETCH`: $249.99
- `SUIT_FORMAL`: $269.99

### Tuxedos (8 tiers)
- `TUXEDO_BUDGET`: $199.99
- `TUXEDO_STANDARD`: $299.99
- `TUXEDO_PREMIUM`: $349.99
- `TUXEDO_VELVET`: $349.99
- `TUXEDO_DESIGNER`: $399.99
- `TUXEDO_SHAWL`: $329.99
- `TUXEDO_PEAK`: $329.99
- `TUXEDO_DOUBLE_BREASTED`: $379.99

### Outerwear (4 tiers)
- `OUTERWEAR_BLAZER`: $199.99
- `OUTERWEAR_VELVET`: $229.99
- `OUTERWEAR_SPARKLE`: $249.99
- `OUTERWEAR_PREMIUM`: $349.99

### Shirts (5 tiers)
- `SHIRT_BASIC`: $34.99
- `SHIRT_STANDARD`: $49.99
- `SHIRT_PREMIUM`: $69.99
- `SHIRT_STRETCH`: $69.99
- `SHIRT_DESIGNER`: $89.99

### Accessories (10 tiers)
- `ACC_BASIC`: $29.99
- `ACC_TIE_STANDARD`: $39.99
- `ACC_TIE_PREMIUM`: $49.99
- `ACC_SUSPENDERS`: $34.99
- `ACC_BELT`: $49.99
- `ACC_CUFFLINKS`: $59.99
- `ACC_POCKET_SQUARE`: $34.99
- `ACC_VEST`: $79.99
- `ACC_CUMMERBUND`: $69.99
- `ACC_BOUTONNIERE`: $39.99

### Shoes (3 tiers)
- `SHOES_STANDARD`: $99.99
- `SHOES_PREMIUM`: $129.99
- `SHOES_DESIGNER`: $149.99

### Boy's (5 tiers)
- `BOYS_SUIT_BASIC`: $99.99
- `BOYS_SUIT_STANDARD`: $129.99
- `BOYS_SUIT_5PC`: $149.99
- `BOYS_TUX`: $169.99
- `BOYS_PREMIUM`: $179.99

### Casual (4 tiers)
- `CASUAL_BASIC`: $59.99
- `CASUAL_CHINOS`: $79.99
- `CASUAL_JEANS`: $99.99
- `CASUAL_PREMIUM`: $149.99

## 🤖 How to Add Products Using Claude

### Step 1: Prepare Your Product Information
Tell Claude:
```
Add a new product:
- Name: "Navy Pinstripe Suit"
- Tier: SUIT_STANDARD
- Sizes: 36R, 38R, 40R, 42R, 44R, 46R, 48R, 50R, 52R, 54R
- Color: Navy
- Material: Wool Blend
- Occasion: Wedding, Business
```

### Step 2: Claude Will Create SQL That:
1. **Creates the product** with proper handle
2. **Sets metadata** with:
   ```json
   {
     "tier": "SUIT_STANDARD",
     "tier_price": 229.99,
     "pricing_tier": "SUIT_STANDARD",
     "stripe_price_id": "price_xxx",
     "tags": "color-navy,material-wool,occasion-wedding",
     "google_category": "Apparel & Accessories > Clothing > Suits"
   }
   ```
3. **Creates variants** for each size with:
   - `manage_inventory`: false (unlimited stock)
   - Proper SKU format
4. **Sets standard prices** at 22999 cents (229.99 * 100) with:
   - `amount`: 22999
   - `raw_amount`: {"value": "22999", "precision": 20}
5. **Links prices** through price sets and region rules

### Step 3: Execute the SQL
Run the SQL script Claude provides against your production database

## 🛠️ What You Can Edit in Admin After Creation

### ✅ SAFE to Edit:
- Product title/description
- Images and thumbnails
- SEO metadata and tags
- Categories
- SKUs (if needed)
- Product status (draft/published)

### ⚠️ NEVER Edit Without Updating Both Systems:
- Prices (must update BOTH metadata.tier_price AND standard price tables)
- Tier assignment
- Variant structure

### 🚨 If You Must Change Prices:
Tell Claude: "Update [product] price to [new price]" and let Claude handle both systems

## 📊 The Pricing Data Flow

```
Product Display:
Frontend → Custom API → metadata.tier_price (DOLLARS) → Shows $229.99

Add to Cart & Checkout:
Frontend → Medusa Cart → Standard Price Table (CENTS) → Charges 22999 cents ($229.99)

Both must match or checkout shows wrong price!
```

## 🎯 Quick Reference for Claude

When adding products, Claude MUST:

```sql
-- 1. Set metadata (DOLLARS)
metadata = jsonb_build_object(
  'tier', 'SUIT_STANDARD',
  'tier_price', 229.99,  -- DOLLARS
  'pricing_tier', 'SUIT_STANDARD',
  'tags', 'color-navy,wedding-suit'
)

-- 2. Set standard price (CENTS)
INSERT INTO price (amount, raw_amount, currency_code)
VALUES (
  22999,  -- CENTS (229.99 * 100)
  jsonb_build_object('value', '22999', 'precision', 20),
  'usd'
)

-- 3. Always set
manage_inventory = false  -- Unlimited stock
```

## 🚫 What Breaks The System

1. **Adding products directly in admin** - Missing tier assignment
2. **Setting prices manually** - Creates mismatch between systems
3. **Importing from spreadsheets** - No tier validation
4. **Editing prices in only one system** - Display/checkout mismatch

## ✅ The Discipline Commitment

1. **ALL products added through Claude** - No exceptions
2. **Price changes through Claude** - Maintains sync
3. **Admin for non-price edits only** - Safe zone
4. **Regular audits** - Claude can check price consistency

## 🆘 Emergency Fixes

If prices are mismatched:
```
Tell Claude: "Audit and fix all product prices to ensure tier_price matches standard prices"
```

If a product has no tier:
```
Tell Claude: "Assign [product] to tier [TIER_NAME] and fix all pricing"
```

## 📝 For AI Agents/Subagents

When working on this project, you MUST:
1. **Read metadata.tier_price** for product prices (in DOLLARS)
2. **Set BOTH metadata AND standard prices** when creating products
3. **Use tier assignments** from the 45-tier structure above
4. **Set manage_inventory = false** for all products
5. **Multiply dollar prices by 100** for standard price tables (cents)

### Example Product Creation Pattern:
```sql
-- Step 1: Create product with metadata
INSERT INTO product (title, handle, metadata)
VALUES (
  'Navy Slim Fit Suit',
  'navy-slim-fit-suit',
  jsonb_build_object(
    'tier', 'SUIT_SLIM_STRETCH',
    'tier_price', 249.99,
    'pricing_tier', 'SUIT_SLIM_STRETCH',
    'tags', 'color-navy,slim-fit,stretch'
  )
);

-- Step 2: Create price set with CENTS
INSERT INTO price (amount, raw_amount, currency_code)
VALUES (
  24999,  -- 249.99 * 100
  jsonb_build_object('value', '24999', 'precision', 20),
  'usd'
);
```

## 🎯 Success Metrics

You know the system is working when:
- Product page shows $229.99
- Cart shows $229.99
- Checkout charges $229.99
- All from the same product with no manual intervention

---

**Remember: Claude is your quality control layer. Use Claude for creation, Admin for minor edits.**

**Last Updated:** December 2024
**System Version:** Medusa v2 with Custom Tier Pricing
**Repository:** /Users/ibrahim/Desktop/medusa-railway-setup