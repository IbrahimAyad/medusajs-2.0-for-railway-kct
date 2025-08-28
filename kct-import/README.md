# KCT Menswear - Medusa v2 Product Import System

## Overview
Complete product import solution for KCT Menswear built for Medusa v2.8.8+

## Features
- ✅ 60+ Products ready to import
- ✅ 4 Main Collections (Suits, Tuxedos, Shirts, Accessories)
- ✅ Full variant support (sizes, colors, fits)
- ✅ Pricing and inventory management
- ✅ SEO metadata for all products
- ✅ Multi-warehouse inventory support
- ✅ Railway deployment ready

## Quick Start

### 1. Copy to your Medusa project
```bash
cp -r kct-medusa-v2-import/* /path/to/your/medusa/project/
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the import
```bash
# Import all products
npm run seed:kct-products

# Or import by category
npm run seed:suits
npm run seed:tuxedos
npm run seed:shirts
npm run seed:accessories
```

### 4. Verify in Admin
Access your Medusa admin panel to see imported products.

## File Structure
```
kct-medusa-v2-import/
├── data/
│   ├── collections.json
│   ├── products/
│   │   ├── suits.json
│   │   ├── tuxedos.json
│   │   ├── shirts.json
│   │   └── accessories.json
│   └── categories.json
├── scripts/
│   ├── import-all.js
│   ├── import-collections.js
│   ├── import-products.js
│   └── seed-kct.js
├── src/
│   └── scripts/
│       └── kct-seed.ts
└── package.json
```

## Deployment

### Railway CLI Method
```bash
# Push to GitHub first
git add .
git commit -m "Add KCT product import system"
git push origin main

# Deploy with Railway CLI
railway up
```

### Direct Deploy Method
```bash
# Run import in production
railway run npm run seed:kct-products
```