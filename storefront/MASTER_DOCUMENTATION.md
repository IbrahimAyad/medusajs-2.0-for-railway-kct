# KCT Menswear V2 - Master Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Master Collections](#master-collections)
3. [Product Database](#product-database)
4. [SEO & Redirects](#seo--redirects)
5. [Technical Architecture](#technical-architecture)
6. [API Endpoints](#api-endpoints)
7. [Deployment Guide](#deployment-guide)
8. [Analytics & Tracking](#analytics--tracking)

---

## 🎯 Project Overview

### Vision
Modern e-commerce platform for KCT Menswear specializing in formal wear, prom attire, and wedding collections.

### Tech Stack
- **Frontend:** Next.js 15.4.5, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL), Next.js API Routes
- **CDN:** Cloudflare R2 for images
- **Payments:** Stripe
- **Analytics:** Google Analytics 4, Custom tracking
- **Deployment:** Vercel

### Key Features
- SuitSupply-inspired master collections
- AI-powered product recommendations
- Visual search with Fashion CLIP
- Real-time inventory management
- 301 redirect system for SEO preservation
- Mobile-first responsive design

---

## 🛍️ Master Collections

### Collection Structure
We have 8 master collections following the SuitSupply pattern:

#### 1. **Suits Collection** (`/collections/suits`)
- Categories: Classic, Summer, Wedding, Luxury, Double Breasted, Three Piece, Tuxedos
- Products: 32 suits
- Price Range: $179-$329
- Features: Scrolling category navigation, 3x3 mobile grid

#### 2. **Blazers & Jackets** (`/collections/blazers`)
- Categories: Summer, Patterned, Velvet, Luxury, Sport Coats
- Products: 30 blazers
- Price Range: $169-$349
- Special: Velvet textures, floral patterns

#### 3. **Knitwear & Sweaters** (`/collections/knitwear`)
- Categories: Crewnecks, Polos, Cardigans, Zip Sweaters, Turtlenecks
- Products: 30 items
- Price Range: $69-$179
- Materials: Merino wool, cashmere

#### 4. **Accessories** (`/collections/accessories`)
- Categories: Ties, Bowties, Suspenders, Pocket Squares, Belts, Socks
- Products: 50+ items
- Price Range: $12-$59
- Colors: 59 tie colors, 24 suspender colors

#### 5. **Shirts** (`/collections/shirts`)
- Categories: Dress, Casual, Turtlenecks, Oxford, Linen
- Products: 26 shirts
- Price Range: $59-$99

#### 6. **Shoes & Footwear** (`/collections/shoes`)
- Categories: Studded, Rhinestone, Velvet Loafers, Dress Shoes
- Products: 26 shoes
- Price Range: $65-$99
- Unique: Statement loafers with studs/rhinestones

#### 7. **Wedding Collection** (`/collections/wedding`)
- Categories: Wedding Tuxedos, Suits, Groomsmen, Accessories
- Products: 26 items
- Price Range: $19-$349
- Colors: Pastels, sage, blush, lavender

#### 8. **Formal & Tuxedos** (`/collections/formal`)
- Categories: Classic, Modern, Three-Piece, Monochromatic, European
- Products: 28 tuxedos
- Price Range: $179-$329

### Collection Features
- Horizontal scrolling category navigation
- Responsive grid (2-6 columns)
- Quick view modals
- Gradient overlays for text visibility
- Filter persistence without page reload
- Like/wishlist functionality

---

## 📊 Product Database

### Database Structure
```json
{
  "products": [
    {
      "id": "unique-id",
      "name": "Product Name",
      "category": "Main Category",
      "subcategory": "Subcategory",
      "price": 229.99,
      "description": "Full description",
      "colors": ["Black", "Navy"],
      "sizes": ["36", "38", "40"],
      "materials": "100% Wool",
      "features": ["Slim Fit", "Satin Lapels"],
      "images": {
        "main": "url",
        "alternates": ["url1", "url2"]
      }
    }
  ]
}
```

### Product Categories from KCT Scan
- **Prom Collection:** European, Paisley, Sequin tuxedos ($229-$329)
- **Wedding:** Pastel suits, groomsmen attire ($199-$229)
- **Tuxedos:** Slim, monochromatic, three-piece ($159-$229)
- **Accessories:** 59 tie colors, 24 suspender colors ($24.99-$29.99)
- **Shoes:** Velvet, studded, rhinestone loafers ($79-$99)

### Total Inventory
- 75+ unique products catalogued
- 500+ color/size combinations
- Price range: $24.99 - $329.99

---

## 🔄 SEO & Redirects

### 301 Redirect Implementation
File: `301-redirects.json` contains 80+ redirect mappings

#### Redirect Categories:
1. **Collection Redirects**
   - `/collections/prom-tuxedos` → `/collections/formal`
   - `/collections/wedding-suits` → `/collections/wedding`

2. **Product Redirects**
   - Old product URLs → New SEO-optimized URLs
   - Pattern-based redirects for accessories

3. **Page Redirects**
   - `/pages/about-us` → `/about`
   - `/pages/size-guide` → `/size-guide`

### Implementation
- Middleware-based redirects in `src/middleware.ts`
- Automatic 301 status codes
- Pattern matching for dynamic redirects
- Preserves SEO value during migration

### SEO Checklist
- [ ] Submit new sitemap to Google Search Console
- [ ] Monitor 404 errors in GSC
- [ ] Update internal links
- [ ] Notify Google of site move
- [ ] Monitor organic traffic

---

## 🏗️ Technical Architecture

### Directory Structure
```
src/
├── app/
│   ├── collections/
│   │   ├── suits/
│   │   ├── blazers/
│   │   ├── knitwear/
│   │   ├── accessories/
│   │   ├── shirts/
│   │   ├── shoes/
│   │   ├── wedding/
│   │   └── formal/
│   ├── api/
│   └── (auth)/
├── components/
│   ├── collections/
│   ├── ui/
│   └── layout/
├── lib/
│   ├── supabase/
│   └── utils/
└── scripts/
    └── import-products-to-supabase.ts
```

### Key Components
1. **MasterCollectionPage:** Reusable collection template
2. **ProductGrid:** Responsive product display
3. **QuickViewModal:** Product detail overlay
4. **CategoryNavigation:** Horizontal scrolling categories

### Database Schema (Supabase)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT,
  subcategory TEXT,
  price DECIMAL(10,2),
  sale_price DECIMAL(10,2),
  description TEXT,
  features TEXT[],
  sizes TEXT[],
  colors TEXT[],
  images JSONB,
  stock_status TEXT,
  metadata JSONB
);
```

---

## 🔌 API Endpoints

### Product APIs
- `GET /api/products` - List all products
- `GET /api/products/[slug]` - Get single product
- `GET /api/products/category/[category]` - Products by category
- `POST /api/products/search` - Search products

### Collection APIs
- `GET /api/collections` - List all collections
- `GET /api/collections/[slug]` - Get collection details

### Analytics APIs
- `POST /api/analytics/track` - Track user events
- `POST /api/analytics/product-view` - Track product views

---

## 🚀 Deployment Guide

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# CDN
NEXT_PUBLIC_CDN_URL=https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev
```

### Deployment Steps
1. Push to GitHub
2. Connect Vercel to repository
3. Set environment variables in Vercel
4. Deploy to production
5. Update DNS records
6. Submit sitemap to search engines

### Performance Optimizations
- Image optimization with Next.js Image
- Lazy loading for product grids
- Code splitting per collection
- CDN for static assets
- Edge caching with Vercel

---

## 📈 Analytics & Tracking

### Google Analytics 4
- E-commerce tracking enabled
- Enhanced conversions
- Product impressions
- Add to cart events
- Purchase tracking

### Custom Events
```javascript
// Track product view
gtag('event', 'view_item', {
  currency: 'USD',
  value: product.price,
  items: [{
    item_id: product.id,
    item_name: product.name,
    category: product.category,
    price: product.price
  }]
});
```

### Performance Metrics
- Core Web Vitals monitoring
- Page load times
- Conversion rates by collection
- Cart abandonment tracking

---

## 🔧 Maintenance Tasks

### Daily
- Monitor error logs
- Check inventory levels
- Review analytics

### Weekly
- Update product descriptions
- Add new products
- Review SEO performance

### Monthly
- Full site backup
- Performance audit
- Security updates
- Analytics report

---

## 📞 Support & Resources

### Technical Support
- GitHub Issues: [github.com/IbrahimAyad/kct-menswear-ai-enhanced](https://github.com/IbrahimAyad/kct-menswear-ai-enhanced)
- Documentation: This file
- API Documentation: `/docs/api`

### Business Resources
- Product Database: `kct_menswear_products_database.json`
- SEO Redirects: `301-redirects.json`
- Analytics Reports: Google Analytics Dashboard

---

## 🎯 Next Steps

### Immediate (Week 1)
- [ ] Deploy to production
- [ ] Implement 301 redirects
- [ ] Import products to Supabase
- [ ] Test checkout flow

### Short-term (Month 1)
- [ ] Add product reviews
- [ ] Implement wishlists
- [ ] Add size guides
- [ ] Email notifications

### Long-term (Quarter 1)
- [ ] AI recommendations
- [ ] Virtual try-on
- [ ] Loyalty program
- [ ] Mobile app

---

Last Updated: January 11, 2025
Version: 2.0.0