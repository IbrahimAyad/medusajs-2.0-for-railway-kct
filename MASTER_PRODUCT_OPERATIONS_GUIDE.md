# Master Product Operations Guide for KCT Menswear

## Agent Architecture

This system uses two specialized agents that work together:

### 1. **VENDOR_SOURCING_AGENT.md**
**Purpose**: Find and import new products from vendors
- Search vendor catalogs
- Extract product information
- Transform vendor data to Medusa format
- Bulk import with proper variants
- Track vendor relationships
- Calculate pricing markups

**When to use**:
- Adding new product lines
- Researching wholesale suppliers
- Bulk importing from vendors
- Setting up dropship products
- Managing vendor relationships

### 2. **MEDUSA_PRODUCT_MANAGEMENT_AGENT.md**
**Purpose**: Manage existing products in Medusa
- Update product information
- Manage variants and sizing
- Adjust pricing
- Control inventory
- Organize collections/categories
- Fix product issues

**When to use**:
- Updating existing products
- Changing prices
- Managing inventory
- Organizing products
- Fixing display issues
- Running reports

## Complete Workflow Example

### Adding New Products from a Vendor

1. **Use VENDOR_SOURCING_AGENT to find products**
```python
# Search for products
"wholesale mens velvet blazers minimum order 10"
# Extract: title, sizes, colors, wholesale price, images
```

2. **Import to Medusa as drafts**
```sql
-- Products created with status='draft'
-- Includes vendor metadata
-- Sets incoming inventory quantities
```

3. **Use MEDUSA_PRODUCT_MANAGEMENT_AGENT to finalize**
```sql
-- Review and adjust pricing
-- Add to collections
-- Set proper categories/tags
-- Update status to 'published'
```

## Quick Reference Decision Tree

```
Need Products?
├── From External Vendor?
│   └── Use VENDOR_SOURCING_AGENT
│       ├── Search catalogs
│       ├── Import as drafts
│       └── Track vendor info
│
└── Already in System?
    └── Use MEDUSA_PRODUCT_MANAGEMENT_AGENT
        ├── Update details
        ├── Manage inventory
        └── Organize products
```

## Database Connection (Both Agents)
```bash
Host: centerbeam.proxy.rlwy.net
Port: 20197
Database: railway
Username: postgres
Password: MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds
```

## Product Type Reference

### Size Configurations

| Product Type | Sizes | Variant Count |
|-------------|-------|---------------|
| **Suits/Tuxedos** | 34R-56R, 34S-46S, 38L-56L | 30 |
| **Blazers** | 36R-52R | 9 |
| **Dress Shirts** | S, M, L, XL, 2XL, 3XL, 4XL | 7 |
| **Turtlenecks** | S, M, L, XL, 2XL, 3XL, 4XL | 7 |
| **Vests** | XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL | 10 |
| **Pants** | 28-42 waist, 28-36 inseam | Varies |
| **Accessories** | One Size | 1 |

### Current Pricing Structure

| Category | Price Range | Notes |
|----------|------------|-------|
| **Sparkle Blazers** | $249.99 | Premium specialty |
| **Velvet Blazers** | $229.99 | Luxury material |
| **Regular Blazers** | $199.99 | Standard blazers |
| **Suits** | $299.99-399.99 | 2-piece standard |
| **Tuxedos** | $349.99-449.99 | Formal events |
| **Vests** | $49.99 | All colors |
| **Dress Shirts** | $69.99 | Standard shirts |
| **Turtlenecks** | $44.99 | Mock & full neck |
| **Accessories** | $49.99 | Ties, suspenders |

### Product Attributes

| Product | Weight (g) | Dimensions (mm) | HS Code |
|---------|------------|-----------------|---------|
| **Suits** | 1800 | 610×460×150 | 620311 |
| **Blazers** | 1400 | 560×410×100 | 620331 |
| **Vests** | 400 | 410×300×50 | 621132 |
| **Shirts** | 300 | 380×280×50 | 620520 |
| **Pants** | 700 | 460×360×75 | 620341 |
| **Accessories** | 113 | 330×100×50 | 621210/621520 |

## Collections & Organization

### Active Collections
- `col_new_arrivals` - Latest 30 products
- `col_wedding` - Tuxedos and formal wear
- `col_prom_2025` - Prom season items
- `col_business` - Professional attire
- `col_luxury` - Premium products
- `col_slim_fit` - Modern fit styles
- `col_big_tall` - Extended sizes
- `col_seasonal` - Current season
- `col_under_200` - Budget friendly
- `col_complete_look` - Full outfits

### Categories
- 2-Piece Suits
- 3-Piece Suits
- Blazers & Sport Coats
- Vests & Waistcoats
- Dress Pants
- Dress Shirts
- Accessories
- Boys Collection
- Outerwear

## Critical IDs

- **Sales Channel**: `sc_01K3S6WP4KCEJX26GNPQKTHTBE`
- **Stock Location**: `sloc_01K3RYPKMN8VRRHMZ890XXVWP5` (Kalamazoo)
- **Shipping Profile**: `sp_01K3PJN0BK5FBHYPATV727YT1N` (Default)
- **Region**: Check with `SELECT id FROM region LIMIT 1`

## Common Operations

### Check Product Status
```sql
SELECT 
    p.title,
    COUNT(pv.id) as variants,
    MAX(il.stocked_quantity) as stock,
    MAX(pr.amount) as price
FROM product p
LEFT JOIN product_variant pv ON pv.product_id = p.id
LEFT JOIN product_variant_inventory_item pvii ON pvii.variant_id = pv.id
LEFT JOIN inventory_item ii ON ii.id = pvii.inventory_item_id
LEFT JOIN inventory_level il ON il.inventory_item_id = ii.id
LEFT JOIN product_variant_price_set pvps ON pvps.variant_id = pv.id
LEFT JOIN price pr ON pr.price_set_id = pvps.price_set_id
WHERE p.status = 'published'
GROUP BY p.id, p.title
ORDER BY p.created_at DESC
LIMIT 10;
```

### Quick Fixes
- **Products showing "0 available"**: Run inventory linking scripts
- **No prices showing**: Create price sets and link to variants
- **Not visible in store**: Link to sales channel
- **Images not loading**: Update thumbnail URL or use placeholder

## Usage Instructions

### For Claude or Other AI Agents:

1. **Starting a new session**: Provide the relevant agent file
   - For vendor sourcing: `VENDOR_SOURCING_AGENT.md`
   - For product management: `MEDUSA_PRODUCT_MANAGEMENT_AGENT.md`

2. **Example prompt for vendor sourcing**:
   > "You are a Vendor Product Sourcing Specialist. Use the VENDOR_SOURCING_AGENT.md documentation to search for wholesale velvet blazers and import them to Medusa."

3. **Example prompt for product management**:
   > "You are a Medusa Product Management Specialist. Use the MEDUSA_PRODUCT_MANAGEMENT_AGENT.md documentation to update all blazer prices to $199.99."

## Files in This System

1. **VENDOR_SOURCING_AGENT.md** - Vendor sourcing and import
2. **MEDUSA_PRODUCT_MANAGEMENT_AGENT.md** - Product management
3. **PRODUCT_ATTRIBUTES_STANDARDS.md** - Industry standards
4. **PRODUCT_UPLOAD_COMPLETE_GUIDE.md** - Original upload guide
5. **MASTER_PRODUCT_OPERATIONS_GUIDE.md** - This file

All files stored in: `/Users/ibrahim/Desktop/medusa-railway-setup/`