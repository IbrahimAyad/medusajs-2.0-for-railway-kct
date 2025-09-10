# KCT Menswear Backend Integration - Phase 1 Implementation Guide

## Overview
This guide outlines the complete backend integration for KCT Menswear's core products (Phase 1). Phase 2 will handle additional products in the Shop tab.

## Current Product Inventory

### Core Products (Phase 1)
- **Suits**: 14 colors × 2 types (2-piece/3-piece) × 29 sizes = **812 variants**
- **Dress Shirts**: 17 colors × 2 fits × 12-17 sizes = **544 variants**
- **Ties**: 80+ colors × 4 styles = **320 variants**
- **Tuxedos**: 5 styles × 29 sizes = **145 variants**
- **Total Core Products**: 116 unique products with **1,821 variants**

### Bundle Products
- **Tie Bundles**: 3 options ($99.95, $149.95, $199.95)
- **Suit Bundles**: 3 tiers ($199.99, $229.99, $249.99)
- **Wedding Bundles**: 16 configurations ($199.99-$249.99)
- **Prom Bundles**: 5 configurations ($249.99)
- **Casual/Cocktail Bundles**: 16 configurations ($199.99)

## Webhook Structure for Orders

### Order Webhook Payload
```json
{
  "event": "order.created",
  "timestamp": "2024-01-31T10:00:00Z",
  "order": {
    "id": "ord_kct_1234567890",
    "number": "KCT-2024-0001",
    "status": "pending",
    "total": 229.99,
    "subtotal": 269.99,
    "discount": 40.00,
    "tax": 0.00,
    "shipping": 0.00,
    "currency": "USD",
    "customer": {
      "id": "cust_1234567890",
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+1234567890",
      "shipping_address": {
        "line1": "123 Main St",
        "line2": "Apt 4B",
        "city": "Detroit",
        "state": "MI",
        "postal_code": "48201",
        "country": "US"
      },
      "billing_address": {
        "same_as_shipping": true
      }
    },
    "items": [
      {
        "id": "item_1",
        "type": "suit",
        "product_id": "suit-navy-3p",
        "stripe_product_id": "prod_SlQuqaI2IR6FRm",
        "stripe_price_id": "price_1Rpv31CHc12x7sCzlFtlUflr",
        "name": "Navy Suit (3-Piece)",
        "sku": "KCT-SUIT-NAVY-3P-40R",
        "price": 199.99,
        "quantity": 1,
        "attributes": {
          "color": "Navy",
          "type": "3-piece",
          "size": "40R"
        },
        "image_url": "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/navy/navy-main-2.jpg"
      },
      {
        "id": "item_2",
        "type": "shirt",
        "product_id": "shirt-white-slim",
        "stripe_product_id": "prod_SlSRMPGpXou00R",
        "stripe_price_id": "price_1RpvWnCHc12x7sCzzioA64qD",
        "name": "White Dress Shirt (Slim)",
        "sku": "KCT-SHIRT-WHITE-SLIM-M",
        "price": 39.99,
        "quantity": 1,
        "attributes": {
          "color": "White",
          "fit": "slim",
          "size": "M"
        },
        "image_url": "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Dress%20Shirts/White-Dress-Shirt.jpg"
      },
      {
        "id": "item_3",
        "type": "tie",
        "product_id": "tie-burgundy-classic",
        "stripe_product_id": "prod_SlSCPLZUyO8MFe",
        "stripe_price_id": "price_1RpvI9CHc12x7sCzE8Q9emhw",
        "name": "Burgundy Classic Tie",
        "sku": "KCT-TIE-BURGUNDY-CLASSIC",
        "price": 24.99,
        "quantity": 1,
        "attributes": {
          "color": "Burgundy",
          "style": "classic"
        },
        "image_url": "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/Bow%3ATie/burgundy-mian.webp"
      }
    ],
    "bundle_info": {
      "is_bundle": true,
      "bundle_type": "professional",
      "bundle_name": "Professional Bundle",
      "original_price": 264.97,
      "bundle_price": 229.99,
      "savings": 34.98
    },
    "metadata": {
      "source": "website",
      "device": "desktop",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "notes": "Customer requested gift wrapping"
    }
  }
}
```

### Tie Bundle Order Structure
```json
{
  "items": [
    {
      "id": "item_1",
      "type": "tie_bundle",
      "product_id": "bundle-tie-8pack",
      "stripe_product_id": "prod_SlSJVpvJgGyQEg",
      "stripe_price_id": "price_1RpvM9CHc12x7sCzqkW3QKUV",
      "name": "8-Tie Bundle",
      "price": 149.95,
      "quantity": 1,
      "bundle_contents": [
        {
          "color": "Navy",
          "style": "classic",
          "sku": "KCT-TIE-NAVY-CLASSIC"
        },
        {
          "color": "Burgundy",
          "style": "classic",
          "sku": "KCT-TIE-BURGUNDY-CLASSIC"
        },
        {
          "color": "Silver",
          "style": "classic",
          "sku": "KCT-TIE-SILVER-CLASSIC"
        },
        {
          "color": "Black",
          "style": "skinny",
          "sku": "KCT-TIE-BLACK-SKINNY"
        },
        {
          "color": "Royal Blue",
          "style": "slim",
          "sku": "KCT-TIE-ROYALBLUE-SLIM"
        },
        {
          "color": "Forest Green",
          "style": "classic",
          "sku": "KCT-TIE-FORESTGREEN-CLASSIC"
        },
        {
          "color": "Gold",
          "style": "bowtie",
          "sku": "KCT-TIE-GOLD-BOWTIE"
        },
        {
          "color": "Charcoal",
          "style": "classic",
          "sku": "KCT-TIE-CHARCOAL-CLASSIC"
        }
      ]
    }
  ]
}
```

## Database Schema Recommendations

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  stripe_product_id VARCHAR(50),
  stripe_price_id VARCHAR(50),
  name VARCHAR(200) NOT NULL,
  category ENUM('suit', 'shirt', 'tie', 'tuxedo', 'bundle'),
  subcategory VARCHAR(50),
  base_price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  sku VARCHAR(50) UNIQUE NOT NULL,
  attributes JSONB, -- {color, size, type, fit, style}
  inventory_count INTEGER DEFAULT 0,
  reserved_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  url TEXT NOT NULL,
  type ENUM('main', 'gallery', 'thumbnail'),
  position INTEGER DEFAULT 0
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2),
  tax DECIMAL(10,2),
  shipping DECIMAL(10,2),
  total DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  bundle_info JSONB -- {is_bundle, bundle_type, bundle_contents}
);
```

## API Endpoints for Admin Dashboard

### Product Management
```
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id

GET    /api/admin/products/:id/variants
POST   /api/admin/products/:id/variants
PUT    /api/admin/products/:id/variants/:variantId
```

### Inventory Management
```
GET    /api/admin/inventory
PUT    /api/admin/inventory/:variantId
POST   /api/admin/inventory/bulk-update
GET    /api/admin/inventory/low-stock
```

### Order Management
```
GET    /api/admin/orders
GET    /api/admin/orders/:id
PUT    /api/admin/orders/:id/status
POST   /api/admin/orders/:id/tracking
GET    /api/admin/orders/export
```

### Bundle Configuration
```
GET    /api/admin/bundles
POST   /api/admin/bundles
PUT    /api/admin/bundles/:id
DELETE /api/admin/bundles/:id
```

## Bundle Management Strategy

### Dynamic Bundle System
1. **Bundle Templates**: Create reusable bundle templates
2. **Seasonal Rotations**: Enable/disable bundles by season
3. **Custom Bundle Builder**: Allow customers to create their own bundles
4. **Pricing Rules**: 
   - Tie Bundles: Fixed prices ($99.95, $149.95, $199.95)
   - Suit Bundles: 15% off total when 3+ items
   - Wedding/Prom: Special occasion pricing

### Bundle Tracking
```json
{
  "bundle_id": "bundle_professional_001",
  "name": "Professional Bundle",
  "type": "suit_bundle",
  "status": "active",
  "components": [
    {"category": "suit", "options": ["2-piece", "3-piece"]},
    {"category": "shirt", "quantity": 1},
    {"category": "tie", "quantity": 1}
  ],
  "pricing": {
    "calculation": "sum_components * 0.85",
    "fixed_price": 229.99,
    "minimum_savings": 40.00
  },
  "valid_from": "2024-01-01",
  "valid_to": null,
  "metadata": {
    "featured": true,
    "occasions": ["business", "wedding"],
    "season": "all"
  }
}
```

## Integration Code Examples

### Frontend Order Submission
```typescript
// Submit order to backend
async function submitOrder(cartItems: CartItem[], customer: Customer) {
  const orderPayload = {
    customer,
    items: cartItems.map(item => ({
      product_id: item.id,
      stripe_product_id: item.stripeProductId,
      stripe_price_id: item.stripePriceId,
      name: item.name,
      sku: generateSKU(item),
      price: item.price,
      quantity: item.quantity,
      attributes: item.attributes,
      image_url: item.image
    })),
    bundle_info: detectBundleType(cartItems),
    metadata: {
      source: 'website',
      device: detectDevice(),
      user_agent: navigator.userAgent
    }
  };
  
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  
  return response.json();
}
```

### Backend Webhook Handler
```typescript
// Handle incoming order webhook
app.post('/webhooks/orders', async (req, res) => {
  const { event, order } = req.body;
  
  if (event === 'order.created') {
    // 1. Create order in database
    const dbOrder = await createOrder(order);
    
    // 2. Reserve inventory
    await reserveInventory(order.items);
    
    // 3. Send to fulfillment
    if (order.bundle_info?.is_bundle) {
      await processBundleOrder(dbOrder);
    } else {
      await processStandardOrder(dbOrder);
    }
    
    // 4. Send confirmation email
    await sendOrderConfirmation(order.customer, dbOrder);
    
    // 5. Update analytics
    await trackOrderMetrics(dbOrder);
  }
  
  res.json({ success: true });
});
```

## Phase 1 Priorities

### Immediate Requirements (Week 1)
1. **Product Import**: Import all 116 core products with Stripe IDs
2. **Order Webhook**: Set up endpoint to receive order data
3. **Basic Admin Dashboard**: 
   - View orders with customer details
   - Order status management
   - Inventory levels by size

### Short-term Goals (Week 2-3)
1. **Inventory Management**: Track stock levels by size/color
2. **Bundle Configuration**: Manage active bundles
3. **Reporting**: Basic sales reports and analytics
4. **Export Functions**: Order data export to CSV/Excel

### Bundle-Specific Handling
- **$199.99 Bundles**: Essential/Casual bundles (2-piece suit + shirt + tie)
- **$229.99 Bundles**: Professional/Wedding bundles (3-piece suit + shirt + tie)
- **$249.99 Bundles**: Executive/Prom bundles (premium selections)

## Alternative Data Transfer Methods

Since Lovalbe might not accept CSV files directly:

### 1. REST API Integration
```bash
# POST products one by one
curl -X POST https://api.lovalbe.com/products \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d @product.json
```

### 2. Bulk JSON Import
```javascript
// Send all products in batches
const batchSize = 50;
const products = require('./products-inventory.json');

for (let i = 0; i < products.length; i += batchSize) {
  const batch = products.slice(i, i + batchSize);
  await importBatch(batch);
  await sleep(1000); // Rate limiting
}
```

### 3. Direct Database Seeding
```sql
-- If you have database access
INSERT INTO products (sku, name, category, price, stripe_product_id)
SELECT * FROM json_populate_recordset(NULL::products, 
  '{your_json_data_here}'::json);
```

### 4. Webhook-Based Sync
```typescript
// Real-time product sync
app.post('/sync/product-created', async (req, res) => {
  const product = req.body;
  await lovalbeAPI.createProduct(product);
});
```

## Next Steps

1. **Review Data**: Check the CSV/JSON files for accuracy
2. **API Documentation**: Get Lovalbe's API documentation
3. **Test Integration**: Start with a few test products
4. **Bulk Import**: Import all products in batches
5. **Webhook Setup**: Configure order webhooks
6. **Monitor & Adjust**: Track first orders and refine

## Support & Questions

For any questions about the product data or integration:
- Product counts and variants are accurate as of January 2024
- All Stripe IDs are from your current implementation
- Bundle logic follows your existing pricing structure
- Image URLs point to your R2 bucket

Ready to proceed with Phase 1 implementation!