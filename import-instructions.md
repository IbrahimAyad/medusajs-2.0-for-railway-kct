# Shopify Product Import Instructions

## CSV Files Created

### 1. **shopify-products-full.csv** (Main Product Data)
- 11 complete products with all details
- Includes descriptions, collections, tags
- Image URLs from Shopify CDN
- Pricing with compare-at prices
- Stock status indicators

### 2. **shopify-variants-detailed.csv** (Size Variants)
- Detailed variant breakdown for 2 products
- All 29 size options per product
- Individual SKUs per size
- Exact inventory quantities
- Ready for bulk variant import

## Import Methods

### Method 1: Manual Import via Medusa Admin
1. Login to: https://backend-production-7441.up.railway.app/app
2. Go to Products → Import
3. Upload `shopify-products-full.csv`
4. Map fields:
   - shopify_id → External ID
   - title → Product Title
   - handle → Handle
   - price → Price
   - total_inventory → Stock
5. Review and import

### Method 2: API Import (Recommended)
```bash
# Import high-stock items first
curl -X POST https://backend-production-7441.up.railway.app/admin/import-shopify \
  -H "Content-Type: application/json" \
  -d '{
    "shopify_ids": [
      "9776181510457",  # 206 units - Charcoal suit
      "9736048738617",  # 99 units - Burgundy tuxedo
      "9736048705849",  # 85 units - Navy tuxedo
      "9736048607545"   # 76 units - Black tuxedo
    ],
    "import_all": false
  }'
```

### Method 3: Bulk Import Script
```javascript
// Save as import-products.js
const products = [
  { id: "9776181510457", name: "Charcoal Double Breasted", stock: 206 },
  { id: "9736048738617", name: "Burgundy Shawl Collar", stock: 99 },
  { id: "9736048705849", name: "Navy Shawl Collar", stock: 85 },
  { id: "9736048607545", name: "Black Shawl Collar", stock: 76 },
  { id: "9736048640313", name: "White Dinner Jacket", stock: 66 },
  { id: "9776181575993", name: "Midnight Blue Suit", stock: 30 },
  { id: "9756412838201", name: "Premium Black Suit", stock: 24 },
  { id: "9736048476473", name: "Black Pin-Stripe", stock: 18 },
  { id: "9736048509241", name: "Navy Pin-Stripe", stock: 11 }
];

// Import in batches of 5
const batchSize = 5;
for(let i = 0; i < products.length; i += batchSize) {
  const batch = products.slice(i, i + batchSize);
  const ids = batch.map(p => p.id);
  console.log(`Importing batch: ${batch.map(p => p.name).join(', ')}`);
  // Make API call here
}
```

## Product Categories

### By Stock Level
- **High Stock (50+ units)**: 4 products
- **Medium Stock (20-49 units)**: 2 products  
- **Low Stock (1-19 units)**: 3 products
- **Out of Stock**: 2 products

### By Type
- **Double Breasted Suits**: 5 products
- **Shawl Collar Tuxedos**: 6 products
- **Price Points**: $174.99 and $250.00

### By Color
- Black: 3 products
- Navy: 3 products
- Charcoal: 1 product
- White: 1 product
- Burgundy: 1 product
- Midnight Blue: 1 product

## Import Priority

### Phase 1: Best Sellers (Import First)
1. M404SK-03 - Charcoal (206 units) - $250
2. M341SK-06 - Burgundy (99 units) - $174.99
3. M341SK-05 - Navy Tuxedo (85 units) - $174.99

### Phase 2: Core Inventory
4. M341SK-03 - Black Tuxedo (76 units) - $174.99
5. M341SK-04 - White Dinner Jacket (66 units) - $174.99
6. M404SK-06 - Midnight Blue (30 units) - $250

### Phase 3: Premium Items
7. M407SK-01 - Premium Black (24 units) - $250
8. M396SK-02 - Black Pin-Stripe (18 units) - $174.99
9. M396SK-03 - Navy Pin-Stripe (11 units) - $174.99

### Phase 4: Out of Stock (Monitor for Restock)
10. M292SK-01 - Classic Shawl (0 units)
11. M292SK-03 - Sophisticated Shawl (0 units)

## Inventory Sync Schedule

### Bi-Weekly Sync (Wednesday & Saturday)
```bash
# Add to cron
0 2 * * 3,6 curl -X PUT https://backend-production-7441.up.railway.app/admin/import-shopify/inventory
```

## Testing Checklist

- [ ] Import 1 test product
- [ ] Verify in admin panel
- [ ] Check variant creation
- [ ] Confirm inventory levels
- [ ] Test image display
- [ ] Verify pricing
- [ ] Check collections/tags
- [ ] Import batch of 5
- [ ] Run inventory sync
- [ ] Import remaining products

## Notes

- Total available: 250+ products in Shopify
- Currently documented: 11 key products
- Average variants per product: 29 sizes
- Total potential SKUs: 7,250+ (250 products × 29 sizes)
- Recommended initial import: 20-30 products
- Full catalog import: Use `import_all: true` (not recommended initially)