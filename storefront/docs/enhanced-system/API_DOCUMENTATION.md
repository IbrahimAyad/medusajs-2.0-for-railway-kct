# KCT Menswear Enhanced Products System - API Documentation

**API Version:** 1.0  
**Last Updated:** August 15, 2025  
**Base URL:** `https://kct-menswear-v2.vercel.app/api`

## Table of Contents

1. [Authentication](#authentication)
2. [Enhanced Products API](#enhanced-products-api)
3. [Hybrid Search API](#hybrid-search-api)
4. [Checkout API](#checkout-api)
5. [Unified Search API](#unified-search-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Supabase RLS Policies](#supabase-rls-policies)
9. [Webhooks](#webhooks)
10. [SDK Examples](#sdk-examples)

---

## Authentication

### Public Endpoints
Most product retrieval endpoints are public and don't require authentication:
- `GET /api/products/enhanced` (active products only)
- `GET /api/products/enhanced/{id}` (active products only)
- `GET /api/products/search`
- `GET /api/products/unified`

### Protected Endpoints
Product management and admin operations require authentication:
- `POST /api/products/enhanced` (Create)
- `PUT /api/products/enhanced/{id}` (Update)
- `DELETE /api/products/enhanced/{id}` (Archive)

### Authentication Methods

#### API Key Authentication (Recommended)
```http
Authorization: Bearer your_supabase_anon_key
```

#### Supabase Auth Session
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'your_supabase_url',
  'your_supabase_anon_key'
);

// Authenticated requests automatically include session
const { data, error } = await supabase
  .from('products_enhanced')
  .select('*')
  .eq('status', 'active');
```

---

## Enhanced Products API

### Base Endpoint: `/api/products/enhanced`

#### Get Products List

**Endpoint:** `GET /api/products/enhanced`

**Query Parameters:**

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `category` | string | Filter by category | - | `suits`, `shirts`, `ties` |
| `subcategory` | string | Filter by subcategory | - | `dress-shirts`, `bow-ties` |
| `brand` | string | Filter by brand | - | `hugo-boss`, `calvin-klein` |
| `status` | enum | Product status | `active` | `active`, `draft`, `archived` |
| `min_price` | number | Minimum price filter | - | `100.00` |
| `max_price` | number | Maximum price filter | - | `500.00` |
| `featured` | boolean | Show only featured | - | `true`, `false` |
| `trending` | boolean | Show only trending | - | `true`, `false` |
| `customizable` | boolean | Show only customizable | - | `true`, `false` |
| `in_stock_only` | boolean | Show only in-stock | - | `true`, `false` |
| `search` | string | Full-text search | - | `navy wool suit` |
| `sort_by` | enum | Sort field | `created_at` | `name`, `price`, `created_at`, `popularity` |
| `sort_order` | enum | Sort direction | `desc` | `asc`, `desc` |
| `page` | number | Page number | `1` | `1`, `2`, `3...` |
| `limit` | number | Items per page (max 100) | `20` | `10`, `20`, `50` |

**Example Request:**
```http
GET /api/products/enhanced?category=suits&min_price=300&max_price=700&featured=true&page=1&limit=20
```

**Response Format:**
```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Premium Navy Wool Suit",
      "slug": "premium-navy-wool-suit",
      "category": "suits",
      "subcategory": "business-suits",
      "brand": "KCT Premium",
      "base_price": 599.99,
      "currency": "USD",
      "pricing_tiers": [
        {
          "tier_id": 12,
          "tier_name": "Premium Plus",
          "price_range": { "min": 550, "max": 649.99 },
          "description": "Premium quality for discerning professionals",
          "target_segment": "executives"
        }
      ],
      "images": {
        "primary": {
          "id": "img_001",
          "url": "https://cdn.kctmenswear.com/products/navy-suit-001.webp",
          "cdn_url": "https://cdn.kctmenswear.com/products/navy-suit-001.webp",
          "alt_text": "Navy Blue Wool Suit - Front View",
          "width": 1200,
          "height": 1600,
          "format": "webp",
          "sort_order": 1,
          "responsive_urls": {
            "thumbnail": "https://cdn.kctmenswear.com/products/navy-suit-001_150x150.webp",
            "small": "https://cdn.kctmenswear.com/products/navy-suit-001_300x400.webp",
            "medium": "https://cdn.kctmenswear.com/products/navy-suit-001_600x800.webp",
            "large": "https://cdn.kctmenswear.com/products/navy-suit-001_1200x1600.webp"
          }
        },
        "gallery": [...]
      },
      "description": "Crafted from premium Italian wool, this navy suit combines classic elegance with modern tailoring...",
      "short_description": "Premium Italian wool navy suit with modern fit",
      "features": [
        "100% Italian Super 120s Wool",
        "Half-Canvas Construction",
        "Modern Slim Fit",
        "Functional Sleeve Buttons"
      ],
      "specifications": {
        "material": "100% Italian Super 120s Wool",
        "fabric_blend": ["Virgin Wool"],
        "care_instructions": ["Dry clean only", "Steam to refresh"],
        "fit_type": "slim",
        "style_details": {
          "lapel_style": "Notched",
          "button_count": 2,
          "vents": "side",
          "formality_level": "business"
        },
        "customizable": true
      },
      "inventory": {
        "total_stock": 50,
        "available_stock": 47,
        "low_stock_threshold": 5,
        "allow_backorder": false
      },
      "seo": {
        "meta_title": "Premium Navy Wool Suit - Italian Tailoring",
        "meta_description": "Shop our premium navy wool suit crafted from Italian Super 120s wool...",
        "schema_type": "Product"
      },
      "status": "active",
      "featured": true,
      "trending": false,
      "stripe_product_id": "enhanced_550e8400-e29b-41d4-a716-446655440000",
      "stripe_price_id": "price_1234567890",
      "created_at": "2025-08-15T10:00:00Z",
      "updated_at": "2025-08-15T14:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 47,
    "limit": 20,
    "has_more": true
  },
  "query_info": {
    "filters_applied": 3,
    "sort_by": "created_at",
    "sort_order": "desc"
  }
}
```

#### Get Single Product

**Endpoint:** `GET /api/products/enhanced/{id-or-slug}`

**Parameters:**
- `{id-or-slug}`: Product UUID or URL slug

**Example Request:**
```http
GET /api/products/enhanced/premium-navy-wool-suit
# OR
GET /api/products/enhanced/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "product": {
    // ... full product object as shown above
  }
}
```

#### Create Product

**Endpoint:** `POST /api/products/enhanced`  
**Authentication:** Required  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "name": "Custom Navy Suit",
  "slug": "custom-navy-suit", // Optional - auto-generated if not provided
  "category": "suits",
  "subcategory": "custom-suits",
  "brand": "KCT Custom",
  "base_price": 799.99,
  "description": "Premium custom-tailored navy suit with personalized fit and styling options.",
  "short_description": "Custom navy suit with personalized tailoring",
  "features": [
    "100% Italian Wool",
    "Custom Fit Measurements",
    "Premium Lining Options",
    "Functional Buttonholes"
  ],
  "images": {
    "primary": {
      "id": "custom_navy_001",
      "url": "https://cdn.kctmenswear.com/products/custom-navy-001.webp",
      "alt_text": "Custom Navy Suit - Front View",
      "width": 1200,
      "height": 1600,
      "format": "webp",
      "sort_order": 1
    },
    "gallery": []
  },
  "specifications": {
    "material": "100% Italian Wool",
    "fit_type": "custom",
    "customizable": true,
    "customization_options": [
      {
        "option_id": "lapel_style",
        "option_name": "Lapel Style",
        "option_type": "style",
        "available_choices": [
          {
            "choice_id": "notched",
            "choice_name": "Notched Lapel",
            "price_modifier": 0,
            "availability": true
          },
          {
            "choice_id": "peaked",
            "choice_name": "Peaked Lapel",
            "price_modifier": 50.00,
            "availability": true
          }
        ]
      }
    ]
  },
  "inventory": {
    "total_stock": 0,
    "available_stock": 0,
    "allow_backorder": true
  },
  "seo": {
    "meta_title": "Custom Navy Suit - Personalized Tailoring",
    "meta_description": "Create your perfect navy suit with our custom tailoring service..."
  },
  "status": "active",
  "featured": false,
  "trending": false
}
```

**Response (201 Created):**
```json
{
  "product": {
    "id": "generated-uuid",
    "name": "Custom Navy Suit",
    "slug": "custom-navy-suit",
    // ... full product object
  },
  "message": "Product created successfully"
}
```

#### Update Product

**Endpoint:** `PUT /api/products/enhanced/{id}`  
**Authentication:** Required  
**Content-Type:** `application/json`

**Request Body:** Same as create, with only fields to update

**Example:**
```json
{
  "base_price": 849.99,
  "featured": true,
  "inventory": {
    "total_stock": 25,
    "available_stock": 25
  }
}
```

**Response (200 OK):**
```json
{
  "product": {
    // ... updated product object
  },
  "message": "Product updated successfully"
}
```

#### Archive Product

**Endpoint:** `DELETE /api/products/enhanced/{id}`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "message": "Product archived successfully",
  "product_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## Hybrid Search API

### Unified Product Search

**Endpoint:** `GET /api/products/search`  
**Purpose:** Search across both legacy and enhanced product systems

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `q` | string | Search term | - |
| `category` | string | Filter by category | - |
| `min_price` | number | Minimum price | - |
| `max_price` | number | Maximum price | - |
| `include_legacy` | boolean | Include legacy products | `true` |
| `include_enhanced` | boolean | Include enhanced products | `true` |
| `sort_by` | enum | Sort by relevance, price, name | `relevance` |
| `limit` | number | Results limit (max 100) | `20` |

**Example Request:**
```http
GET /api/products/search?q=navy+suit&category=suits&min_price=200&max_price=800&include_legacy=true&include_enhanced=true&limit=20
```

**Response Format:**
```json
{
  "products": [
    {
      "source": "enhanced",
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Premium Navy Wool Suit",
      "price": 599.99,
      "image_url": "https://cdn.kctmenswear.com/products/navy-suit-001_medium.webp",
      "product_url": "/products/premium-navy-wool-suit",
      "category": "suits",
      "in_stock": true,
      "rating": 4.8,
      "review_count": 34
    },
    {
      "source": "legacy",
      "id": "bundle-navy-classic",
      "name": "Navy Classic Bundle",
      "price": 299.99,
      "image_url": "https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/navy-classic.webp",
      "product_url": "/bundles/bundle-navy-classic",
      "category": "bundles",
      "in_stock": true
    }
  ],
  "results_info": {
    "total_count": 45,
    "legacy_count": 32,
    "enhanced_count": 13,
    "search_term": "navy suit",
    "filters_applied": {
      "category": "suits",
      "price_range": { "min": 200, "max": 800 }
    }
  },
  "facets": {
    "price_range": { "min": 199.99, "max": 799.99 },
    "categories": [
      { "category": "suits", "count": 28 },
      { "category": "bundles", "count": 17 }
    ],
    "sources": [
      { "source": "legacy", "count": 32 },
      { "source": "enhanced", "count": 13 }
    ]
  }
}
```

### Advanced Search (POST)

**Endpoint:** `POST /api/products/search`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "search_term": "navy wool suit",
  "filters": {
    "category": ["suits", "blazers"],
    "price_range": { "min": 300, "max": 1000 },
    "brand": ["KCT Premium", "Hugo Boss"],
    "features": ["Italian Wool", "Custom Fit"],
    "in_stock_only": true
  },
  "sort": {
    "sort_by": "relevance",
    "sort_order": "desc"
  },
  "pagination": {
    "page": 1,
    "limit": 24
  },
  "sources": {
    "include_legacy": true,
    "include_enhanced": true,
    "prefer_source": "enhanced"
  }
}
```

---

## Checkout API

### Create Checkout Session

**Endpoint:** `POST /api/checkout/enhanced`  
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "items": [
    {
      "product_id": "550e8400-e29b-41d4-a716-446655440000",
      "product_type": "enhanced",
      "quantity": 1,
      "customizations": [
        {
          "option_id": "lapel_style",
          "choice_id": "peaked",
          "price_modifier": 50.00
        }
      ],
      "selected_variants": [
        {
          "variant_type": "size",
          "variant_value": "42R"
        }
      ]
    }
  ],
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "shipping_address": {
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  }
}
```

**Response:**
```json
{
  "checkout_session": {
    "id": "cs_1234567890",
    "url": "https://checkout.stripe.com/pay/cs_1234567890",
    "expires_at": "2025-08-15T18:00:00Z"
  },
  "order_summary": {
    "subtotal": 649.99,
    "tax": 52.00,
    "shipping": 0.00,
    "total": 701.99,
    "currency": "USD"
  }
}
```

### Test Checkout Flow

**Endpoint:** `POST /api/test-checkout-flow`  
**Purpose:** End-to-end checkout testing

**Request:**
```json
{
  "test_product_id": "550e8400-e29b-41d4-a716-446655440000",
  "test_scenario": "enhanced_product_checkout",
  "customer_email": "test@kctmenswear.com"
}
```

**Response:**
```json
{
  "test_results": {
    "product_retrieval": "✅ Success",
    "stripe_price_creation": "✅ Success",
    "checkout_session_creation": "✅ Success",
    "webhook_simulation": "✅ Success",
    "order_confirmation": "✅ Success"
  },
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_123",
  "test_completion_time": "1.2s"
}
```

---

## Unified Search API

### Comprehensive Search

**Endpoint:** `GET /api/products/unified`  
**Purpose:** Search across all product types with advanced filtering

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search term |
| `category` | array | Categories to include |
| `price_min` | number | Minimum price |
| `price_max` | number | Maximum price |
| `sort` | enum | `relevance`, `price_asc`, `price_desc`, `name_asc`, `name_desc`, `newest` |
| `page` | number | Page number |
| `per_page` | number | Results per page |
| `filters` | object | Advanced filters |

**Advanced Filters Object:**
```json
{
  "material": ["wool", "cotton", "silk"],
  "fit": ["slim", "regular", "relaxed"],
  "occasion": ["business", "formal", "casual"],
  "color": ["navy", "black", "gray"],
  "size": ["38R", "40R", "42R"],
  "brand": ["KCT", "Hugo Boss"],
  "features": ["customizable", "italian_wool"],
  "availability": "in_stock",
  "rating_min": 4.0
}
```

**Example Request:**
```http
GET /api/products/unified?search=navy+suit&category[]=suits&category[]=blazers&price_min=300&price_max=800&sort=relevance&filters[material][]=wool&filters[fit][]=slim&page=1&per_page=20
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "details": "Technical details for debugging",
  "hint": "Suggested solution or next steps",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-15T12:00:00Z",
  "request_id": "req_1234567890"
}
```

### Common Error Codes

#### Authentication Errors (401)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required for this endpoint",
  "code": "AUTH_REQUIRED",
  "hint": "Include valid Authorization header"
}
```

#### Validation Errors (400)
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": {
    "field_errors": {
      "base_price": ["Price must be a positive number"],
      "category": ["Category is required"]
    }
  },
  "code": "VALIDATION_FAILED"
}
```

#### Not Found Errors (404)
```json
{
  "error": "Not Found",
  "message": "Product not found",
  "details": "No product found with ID: 550e8400-e29b-41d4-a716-446655440000",
  "code": "PRODUCT_NOT_FOUND"
}
```

#### Database Errors (503)
```json
{
  "error": "Database Error",
  "message": "Database connection failed",
  "details": "Could not establish connection to Supabase",
  "hint": "Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables",
  "code": "DATABASE_CONNECTION_FAILED"
}
```

#### RLS Policy Errors (403)
```json
{
  "error": "Permission Denied",
  "message": "Database permission error",
  "details": "RLS policies prevent access to products_enhanced table",
  "hint": "Ensure proper RLS policies are configured",
  "code": "RLS_POLICY_VIOLATION"
}
```

---

## Rate Limiting

### Default Limits

| Endpoint Type | Requests per Minute | Requests per Hour |
|---------------|-------------------|-------------------|
| Public GET | 1000 | 10,000 |
| Search APIs | 500 | 5,000 |
| Protected POST/PUT | 100 | 1,000 |
| Admin Operations | 60 | 600 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1692102000
X-RateLimit-Window: 60
```

### Rate Limit Exceeded Response (429)

```json
{
  "error": "Rate Limit Exceeded",
  "message": "Too many requests",
  "retry_after": 60,
  "limit": 1000,
  "window": 60,
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Supabase RLS Policies

### Products Enhanced Table

**Public Read Access:**
```sql
CREATE POLICY "Public can view active products" 
ON products_enhanced FOR SELECT 
USING (status = 'active');
```

**Admin Full Access:**
```sql
CREATE POLICY "Admins can manage all products" 
ON products_enhanced FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'email' IN (
    'admin@kctmenswear.com',
    'manager@kctmenswear.com'
  )
);
```

**Authenticated User Restrictions:**
```sql
CREATE POLICY "Users can view published products" 
ON products_enhanced FOR SELECT 
USING (
  status = 'active' OR 
  (auth.role() = 'authenticated' AND status IN ('active', 'draft'))
);
```

### Product Variants Enhanced Table

```sql
-- Public can view variants for active products
CREATE POLICY "Public can view active variants" 
ON product_variants_enhanced FOR SELECT 
USING (
  active = true AND 
  EXISTS (
    SELECT 1 FROM products_enhanced 
    WHERE id = product_id AND status = 'active'
  )
);

-- Admins can manage all variants
CREATE POLICY "Admins can manage variants" 
ON product_variants_enhanced FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');
```

### Product Reviews Enhanced Table

```sql
-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews" 
ON product_reviews_enhanced FOR SELECT 
USING (status = 'approved');

-- Users can create reviews
CREATE POLICY "Users can create reviews" 
ON product_reviews_enhanced FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Users can edit their own reviews
CREATE POLICY "Users can edit own reviews" 
ON product_reviews_enhanced FOR UPDATE 
USING (customer_email = auth.jwt() ->> 'email');
```

---

## Webhooks

### Stripe Webhook Handler

**Endpoint:** `POST /api/stripe/webhook`  
**Content-Type:** `application/json`

**Supported Events:**
- `payment_intent.succeeded`
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.created`

**Webhook Signature Verification:**
```typescript
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { 
      status: 400 
    });
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    // ... other event handlers
  }
  
  return new Response('OK', { status: 200 });
}
```

### Product Update Webhook

**Endpoint:** `POST /api/webhooks/product-updated`

**Payload:**
```json
{
  "event": "product.updated",
  "product_id": "550e8400-e29b-41d4-a716-446655440000",
  "changes": {
    "price": { "old": 599.99, "new": 649.99 },
    "inventory": { "old": 10, "new": 5 }
  },
  "timestamp": "2025-08-15T12:00:00Z"
}
```

---

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
// Enhanced Products Client
class KCTEnhancedProductsAPI {
  private baseUrl: string;
  private apiKey?: string;
  
  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  // Get products with filters
  async getProducts(filters: ProductFilters = {}): Promise<ProductResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await fetch(`${this.baseUrl}/api/products/enhanced?${params}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Get single product
  async getProduct(idOrSlug: string): Promise<{ product: EnhancedProduct }> {
    const response = await fetch(`${this.baseUrl}/api/products/enhanced/${idOrSlug}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Product not found');
      }
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Create product (requires authentication)
  async createProduct(productData: CreateProductData): Promise<{ product: EnhancedProduct }> {
    const response = await fetch(`${this.baseUrl}/api/products/enhanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create product');
    }
    
    return response.json();
  }
  
  // Hybrid search
  async search(query: SearchQuery): Promise<SearchResults> {
    const response = await fetch(`${this.baseUrl}/api/products/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });
    
    return response.json();
  }
}

// Usage example
const kctApi = new KCTEnhancedProductsAPI('https://kct-menswear-v2.vercel.app');

// Get featured suits
const featuredSuits = await kctApi.getProducts({
  category: 'suits',
  featured: true,
  status: 'active'
});

// Search products
const searchResults = await kctApi.search({
  search_term: 'navy wool suit',
  filters: {
    price_range: { min: 300, max: 800 },
    material: ['wool']
  },
  include_legacy: true,
  include_enhanced: true
});

// Get specific product
const product = await kctApi.getProduct('premium-navy-wool-suit');
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

export function useEnhancedProduct(idOrSlug: string) {
  const [product, setProduct] = useState<EnhancedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/enhanced/${idOrSlug}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    
    if (idOrSlug) {
      fetchProduct();
    }
  }, [idOrSlug]);
  
  return { product, loading, error };
}

// Usage in React component
function ProductDetail({ productSlug }: { productSlug: string }) {
  const { product, loading, error } = useEnhancedProduct(productSlug);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Product not found</div>;
  
  return (
    <div>
      <h1>{product.name}</h1>
      <p>${product.base_price}</p>
      <img src={product.images.primary.responsive_urls.medium} alt={product.images.primary.alt_text} />
    </div>
  );
}
```

### cURL Examples

```bash
# Get active products
curl "https://kct-menswear-v2.vercel.app/api/products/enhanced?status=active&category=suits"

# Search products
curl -X POST "https://kct-menswear-v2.vercel.app/api/products/search" \
  -H "Content-Type: application/json" \
  -d '{
    "search_term": "navy suit",
    "filters": {
      "price_range": { "min": 300, "max": 800 }
    },
    "include_legacy": true,
    "include_enhanced": true
  }'

# Create product (authenticated)
curl -X POST "https://kct-menswear-v2.vercel.app/api/products/enhanced" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "name": "Test Suit",
    "category": "suits",
    "base_price": 499.99,
    "description": "Test product description",
    "images": {
      "primary": {
        "id": "test_001",
        "url": "https://cdn.kctmenswear.com/test.webp",
        "alt_text": "Test Suit",
        "width": 1200,
        "height": 1600,
        "format": "webp",
        "sort_order": 1
      }
    }
  }'
```

---

This comprehensive API documentation provides everything needed to integrate with the KCT Menswear Enhanced Products System. The API is designed for high performance, reliability, and ease of use while maintaining backward compatibility with the existing system.