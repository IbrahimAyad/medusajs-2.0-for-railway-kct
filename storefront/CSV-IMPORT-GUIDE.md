# 📊 CSV Import Guide for KCT Menswear

## Overview
This guide explains how to prepare and import your optimized product CSV into the database with the new collections system.

## 🗂️ CSV Column Definitions

### Required Fields
| Column | Description | Example |
|--------|-------------|---------|
| `sku` | Unique product identifier | SUIT-NAVY-2P-001 |
| `name` | Product display name | Classic Navy Two-Piece Suit |
| `description` | Full product description | Premium wool suit with modern tailoring |
| `master_category` | Main category | Suits, Shirts, Ties, Blazers |
| `base_price` | Regular price | 299.99 |
| `primary_image` | Main product image URL | https://... |

### Category & Organization
| Column | Description | Example |
|--------|-------------|---------|
| `subcategory` | Secondary category | Two-Piece, Three-Piece, Dress Shirts |
| `collection` | Collection slug | suits, shirts, wedding, prom |
| `tags` | Comma-separated tags | navy,suit,formal,wedding |
| `occasions` | Event types (comma-separated) | wedding,business,formal |

### Product Details
| Column | Description | Example |
|--------|-------------|---------|
| `color` | Specific color name | Navy, Royal Blue, Burgundy |
| `color_family` | Color group for filtering | blue, red, black, grey |
| `size_range` | Available sizes | 34S-54L, 14.5-18, S-3XL |
| `materials` | Fabric types (comma-separated) | wool,polyester,silk |
| `fit_type` | Fit style | slim-fit, classic-fit, modern-fit |
| `style_profile` | Style category | classic, modern, trendy, formal |

### Images & Media
| Column | Description | Example |
|--------|-------------|---------|
| `gallery_images` | Additional images (comma-separated URLs) | url1.jpg,url2.jpg,url3.jpg |

### Inventory & Status
| Column | Description | Example |
|--------|-------------|---------|
| `in_stock` | Boolean availability | true, false |
| `featured` | Featured product flag | true, false |
| `trending` | Trending product flag | true, false |
| `sale_price` | Discounted price (optional) | 249.99 |

### Bundle Information
| Column | Description | Example |
|--------|-------------|---------|
| `bundle_components` | JSON object with bundle items | See bundle example below |

### Integration Fields
| Column | Description | Example |
|--------|-------------|---------|
| `vendor` | Supplier/brand name | KCT Menswear |
| `stripe_product_id` | Stripe product ID | prod_abc123 |
| `stripe_price_id` | Stripe price ID | price_xyz789 |

## 📝 CSV Format Rules

### 1. Text Fields
- Use double quotes for fields with commas: `"Premium suit, perfect for weddings"`
- Escape quotes with double quotes: `"Men's ""Executive"" Suit"`

### 2. Multiple Values
- Use commas for arrays: `wedding,business,formal`
- No spaces after commas unless part of the value

### 3. URLs
- Must be complete URLs starting with https://
- Multiple URLs separated by commas

### 4. Bundle Components JSON Format
```json
{
  "suit": {"sku": "SUIT-NAVY-2P-001", "color": "Navy"},
  "shirt": {"sku": "SHIRT-WHITE-001", "color": "White"},
  "tie": {"sku": "TIE-BURG-SILK-001", "color": "Burgundy"}
}
```

## 🏷️ Master Category Options
Use these exact values for `master_category`:
- `Suits`
- `Shirts`
- `Ties`
- `Blazers`
- `Vests`
- `Accessories`
- `Bundles`
- `Shoes`
- `Pants`

## 🎨 Color Family Mapping
Map specific colors to families:
- `blue`: navy, royal-blue, sky-blue, midnight-blue
- `black`: black, charcoal, onyx
- `grey`: grey, silver, slate
- `red`: burgundy, wine, crimson
- `brown`: brown, tan, beige, khaki
- `green`: emerald, forest, olive
- `white`: white, ivory, cream
- `purple`: purple, plum, lavender
- `gold`: gold, champagne
- `multi`: for products with multiple colors

## 🏪 Collection Slugs
Use these for the `collection` field:
- `suits` - All suit products
- `shirts` - Dress shirts and formal shirts
- `ties` - Ties and accessories
- `wedding` - Wedding collection
- `prom` - Prom collection
- `bundles` - Complete outfits
- `seasonal` - Seasonal items
- `sale` - Sale items

## 📋 Pre-Import Checklist

### ✅ Database Preparation
1. Run `database-preparation.sql` to set up tables and columns
2. Verify all indexes are created
3. Check that collections table is populated

### ✅ CSV Validation
1. Verify all required columns are present
2. Check that SKUs are unique
3. Validate all URLs are accessible
4. Ensure prices are numeric
5. Confirm boolean values are `true` or `false`

### ✅ Image Preparation
1. All images should be optimized (< 2MB)
2. Use CDN URLs when possible
3. Ensure consistent aspect ratios
4. Have both main and gallery images

## 🚀 Import Process

### Step 1: Prepare Database
```sql
-- Run in Supabase SQL Editor
-- Execute the database-preparation.sql file
```

### Step 2: Import CSV
```bash
# Using the import script
npm run import:products -- --file=your-products.csv --batch=import-2024-01
```

### Step 3: Auto-Assign Collections
```sql
-- Run after import to assign products to collections
SELECT auto_assign_collections();
```

### Step 4: Generate Smart Tags
```bash
# Run the smart tagger
npm run tags:update
```

### Step 5: Update Search Indexes
```sql
-- Refresh search vectors
UPDATE products SET updated_at = NOW();
```

### Step 6: Verify Import
```sql
-- Check import results
SELECT 
  import_batch,
  COUNT(*) as product_count,
  COUNT(DISTINCT master_category) as categories,
  COUNT(DISTINCT collection) as collections
FROM products
WHERE import_batch = 'import-2024-01'
GROUP BY import_batch;
```

## 🔍 Post-Import Validation

### Check Product Distribution
```sql
SELECT 
  master_category,
  COUNT(*) as count,
  AVG(base_price) as avg_price
FROM products
GROUP BY master_category
ORDER BY count DESC;
```

### Verify Collections
```sql
SELECT 
  c.name,
  c.slug,
  c.product_count
FROM collections c
ORDER BY c.display_order;
```

### Check for Missing Images
```sql
SELECT COUNT(*) 
FROM products 
WHERE primary_image IS NULL 
OR primary_image = '';
```

## 🛠️ Troubleshooting

### Common Issues

1. **Duplicate SKUs**
   - Solution: Ensure all SKUs are unique in your CSV

2. **Invalid JSON in bundle_components**
   - Solution: Validate JSON format, escape quotes properly

3. **Missing categories**
   - Solution: Use only predefined master_category values

4. **Image URLs not loading**
   - Solution: Verify URLs are publicly accessible

5. **Products not appearing in collections**
   - Solution: Run `SELECT auto_assign_collections();`

## 📊 Sample Data Scenarios

### Simple Product
```csv
SHIRT-BLUE-001,Blue Dress Shirt,Classic cotton shirt,Shirts,69.99,https://image.jpg
```

### Product with Sale
```csv
SUIT-GREY-001,Grey Suit,Modern fit suit,Suits,299.99,249.99,https://image.jpg
```

### Bundle Product
```csv
BUNDLE-001,Wedding Bundle,Complete outfit,Bundles,399.99,,https://image.jpg,"{""suit"":""SUIT-001""}"
```

## 📈 Expected Results

After successful import:
- ✅ All products visible in database
- ✅ Collections automatically populated
- ✅ Smart tags generated
- ✅ Search functionality working
- ✅ Master collections page shows correct counts
- ✅ Filtering and sorting operational

## 🔄 Updating Existing Products

To update existing products:
1. Include the same SKU
2. Set `import_batch` to identify the update
3. Run import script with `--update` flag
4. System will merge changes

---

## Need Help?
- Check import logs: `SELECT * FROM import_logs ORDER BY started_at DESC;`
- View errors: `SELECT errors FROM import_logs WHERE status = 'failed';`
- Contact support with your `batch_id` for assistance