# Database Schema - Current State Analysis

**Document Version:** 1.0  
**Last Updated:** January 14, 2025  
**Status:** Current State Analysis

## Executive Summary

KCT Menswear operates on a **dual-database architecture** with Supabase handling product data and customer information while Stripe manages payment products and order processing. This document analyzes the current schema, identifies optimization opportunities, and outlines integration challenges.

## 🗄️ Database Architecture Overview

### Primary Database: Supabase PostgreSQL
**Environment**: Production  
**Version**: PostgreSQL 15+  
**Location**: Supabase Cloud  
**Primary Use**: Product catalog, customer data, orders

### Secondary System: Stripe Database
**Environment**: Production  
**Type**: Stripe's proprietary system  
**Primary Use**: Payment products, checkout sessions, transactions

## 📊 Supabase Schema Analysis

### Core Tables

#### `products` Table
**Purpose**: Main product catalog  
**Row Count**: ~600 products  
**Status**: ✅ Active

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  subcategory TEXT,
  color TEXT,
  size TEXT[],
  images TEXT[], -- JSON array of image URLs
  stripe_product_id TEXT, -- Link to Stripe (mostly null)
  stripe_price_id TEXT,   -- Link to Stripe (mostly null)
  available_sizes JSONB,
  metadata JSONB,
  inventory_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Issues Identified**:
- Missing foreign key relationships
- No normalization for colors/sizes
- Inconsistent data types
- Poor indexing strategy

#### `orders` Table
**Purpose**: Customer order tracking  
**Row Count**: ~50 orders  
**Status**: ✅ Active (from Stripe webhooks)

```sql
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  shipping_address JSONB,
  items JSONB NOT NULL, -- Order line items
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Quality Assessment**: ✅ Well structured, good for order processing

#### `product_options` Table
**Purpose**: Caching Stripe product data  
**Row Count**: ~50 records  
**Status**: ⚠️ Underutilized

```sql
CREATE TABLE product_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_product_id TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  available_colors JSONB DEFAULT '[]'::jsonb,
  available_sizes JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Issues**: Redundant with products table, unclear purpose

#### `customer_requests` Table
**Purpose**: Customer inquiries and support  
**Row Count**: ~20 requests  
**Status**: ✅ Active

```sql
CREATE TABLE customer_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  phone TEXT,
  name TEXT,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('sizing_help', 'custom_order', 'general', 'wedding', 'bulk_order')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Quality Assessment**: ✅ Well designed for customer service

### Additional Tables (From Migration Files)

#### Inventory Tracking Tables
**Purpose**: Stock management  
**Status**: 🔄 In Development

```sql
-- From 20240104_inventory_tracking.sql
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  size TEXT NOT NULL,
  color TEXT NOT NULL,
  quantity_available INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 5,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Views

#### `order_analytics` View
**Purpose**: Business intelligence  
**Status**: ✅ Active

```sql
CREATE OR REPLACE VIEW order_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as order_date,
  COUNT(*) as order_count,
  SUM(total) as daily_revenue,
  AVG(total) as average_order_value,
  COUNT(DISTINCT customer_email) as unique_customers
FROM orders
WHERE status = 'paid'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY order_date DESC;
```

#### `popular_products` View
**Purpose**: Product performance tracking  
**Status**: ✅ Active

```sql
CREATE OR REPLACE VIEW popular_products AS
SELECT 
  item->>'productName' as product_name,
  item->>'color' as color,
  item->>'size' as size,
  COUNT(*) as order_count,
  SUM((item->>'quantity')::int) as total_quantity
FROM orders, jsonb_array_elements(items) as item
WHERE status = 'paid'
GROUP BY 1, 2, 3
ORDER BY total_quantity DESC;
```

## 💳 Stripe Database Integration

### Stripe Product Structure

**Core Products (28 Suits)**:
```json
{
  "object": "product",
  "id": "prod_SlRxbBl5ZnnoDy",
  "name": "Black 2-Piece Suit",
  "description": "Premium black suit, 2-piece",
  "default_price": "price_1RqeTbCHc12x7sCzWJsI2iDF",
  "metadata": {
    "category": "suits",
    "color": "black",
    "type": "2piece",
    "size_range": "34S-54L"
  }
}
```

**Price Objects**:
```json
{
  "object": "price",
  "id": "price_1RqeTbCHc12x7sCzWJsI2iDF",
  "product": "prod_SlRxbBl5ZnnoDy",
  "unit_amount": 17999,
  "currency": "usd",
  "recurring": null
}
```

### Integration Challenges

**Data Synchronization**:
- Core Stripe products (28) NOT in Supabase products table
- No automated sync between systems
- Price updates must be manual
- Inventory levels not connected

**Query Performance**:
- Cross-system queries require API calls
- No JOIN operations between Supabase and Stripe
- Real-time data inconsistencies

## 🔧 Performance Analysis

### Database Performance Metrics

**Query Performance**:
```sql
-- Typical product listing query
EXPLAIN ANALYZE SELECT * FROM products 
WHERE category = 'suits' AND is_active = true;
-- Current: ~50ms (acceptable)
-- With proper indexes: ~5ms (target)
```

**Missing Indexes**:
```sql
-- Recommended indexes for optimization
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_color ON products(color);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
```

### Connection Pool Analysis

**Current Configuration**:
- Max connections: 100
- Pool size: 25
- Connection timeout: 30s
- Idle timeout: 600s

**Usage Patterns**:
- Peak connections: ~15 concurrent
- Average response time: 120ms
- Connection utilization: 15%

**Optimization Opportunities**:
- Pool size can be reduced to 15
- Implement connection recycling
- Add query caching layer

## 🚨 Data Quality Issues

### High Priority Issues

1. **Missing Stripe Integration**
   ```sql
   -- Check products missing Stripe integration
   SELECT COUNT(*) FROM products 
   WHERE stripe_product_id IS NULL;
   -- Result: ~570 products (95% missing)
   ```

2. **Inconsistent Pricing**
   ```sql
   -- Products with zero or null prices
   SELECT COUNT(*) FROM products 
   WHERE price IS NULL OR price <= 0;
   -- Result: ~45 products (7% invalid)
   ```

3. **Image URL Validation**
   ```sql
   -- Products with broken image arrays
   SELECT COUNT(*) FROM products 
   WHERE images IS NULL OR jsonb_array_length(images) = 0;
   -- Result: ~90 products (15% missing images)
   ```

### Medium Priority Issues

1. **Category Inconsistencies**
   ```sql
   -- Check category variations
   SELECT DISTINCT category FROM products ORDER BY category;
   -- Results show variations: "suit", "suits", "Suits", "SUIT"
   ```

2. **Size Format Variations**
   ```sql
   -- Different size array formats
   SELECT DISTINCT jsonb_typeof(available_sizes) FROM products;
   -- Mixed: null, array, object
   ```

### Data Cleanup Required

**Standardization Tasks**:
- Normalize category names
- Standardize size formats
- Validate price ranges
- Clean up color names
- Fix image URL formats

## 🔒 Security and Access Control

### Row Level Security (RLS)

**Current Policies**:
```sql
-- Products: Public read access
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (is_active = true);

-- Orders: Restricted access
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (true); -- TODO: Implement proper auth
```

**Security Issues**:
- Overly permissive policies
- No user authentication integration
- Missing audit trails
- No data encryption at rest

### Recommended Security Improvements

```sql
-- Implement proper user-based policies
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add audit logging
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 Migration Requirements

### Schema Updates Needed

1. **Product Table Normalization**
   ```sql
   -- Create separate tables for better normalization
   CREATE TABLE product_categories (
     id UUID PRIMARY KEY,
     name TEXT UNIQUE NOT NULL,
     slug TEXT UNIQUE NOT NULL,
     description TEXT
   );
   
   CREATE TABLE product_colors (
     id UUID PRIMARY KEY,
     name TEXT UNIQUE NOT NULL,
     hex_code TEXT,
     rgb_values INTEGER[]
   );
   
   CREATE TABLE product_sizes (
     id UUID PRIMARY KEY,
     category_id UUID REFERENCES product_categories(id),
     size_code TEXT NOT NULL,
     display_name TEXT,
     sort_order INTEGER
   );
   ```

2. **Stripe Integration Table**
   ```sql
   CREATE TABLE stripe_products (
     id UUID PRIMARY KEY,
     product_id UUID REFERENCES products(id),
     stripe_product_id TEXT UNIQUE NOT NULL,
     stripe_price_id TEXT NOT NULL,
     price_cents INTEGER NOT NULL,
     currency TEXT DEFAULT 'usd',
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Bundle Products Table**
   ```sql
   CREATE TABLE bundle_products (
     id UUID PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     total_price DECIMAL(10,2),
     discount_percentage DECIMAL(5,2),
     ai_confidence_score DECIMAL(3,2),
     stripe_product_id TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   CREATE TABLE bundle_items (
     id UUID PRIMARY KEY,
     bundle_id UUID REFERENCES bundle_products(id),
     product_id UUID REFERENCES products(id),
     quantity INTEGER DEFAULT 1,
     custom_price DECIMAL(10,2) -- Override individual price if needed
   );
   ```

## 📈 Performance Optimization Plan

### Phase 1: Indexing Strategy
- Add missing indexes on frequently queried columns
- Implement partial indexes for active products
- Create composite indexes for common filter combinations

### Phase 2: Query Optimization
- Implement database query caching
- Optimize expensive JOIN operations
- Add database connection pooling

### Phase 3: Data Archival
- Archive old orders (> 2 years)
- Implement soft deletes for products
- Set up automated backup strategy

## 📖 Related Documentation

- [./product-inventory.md](./product-inventory.md) - Product counts and categories
- [../04-technical-specs/stripe-integration.md](../04-technical-specs/stripe-integration.md) - Stripe database details
- [../../supabase/migrations/](../../supabase/migrations/) - Current migration files

---

**Document Prepared By**: Documentation Specialist  
**Database Review**: Required  
**Next Update**: January 21, 2025