# KCT Menswear Enhanced Products System - Deployment Guide

**Deployment Version:** 1.0  
**Last Updated:** August 15, 2025  
**Target Platform:** Vercel with Supabase Backend

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Stripe Integration](#stripe-integration)
5. [Vercel Deployment](#vercel-deployment)
6. [CDN Configuration](#cdn-configuration)
7. [Database Migrations](#database-migrations)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [SSL & Security](#ssl--security)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Rollback Procedures](#rollback-procedures)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js:** 18.17.0 or later
- **npm:** 9.0.0 or later
- **Git:** Latest version
- **Vercel CLI:** Latest version
- **Supabase CLI:** Latest version (optional but recommended)

### Required Accounts

1. **Vercel Account** - For hosting and deployment
2. **Supabase Account** - For database and authentication
3. **Stripe Account** - For payment processing
4. **Cloudflare Account** - For CDN (optional but recommended)
5. **Google Analytics Account** - For analytics tracking
6. **SendGrid Account** - For email notifications

### Access Requirements

- Admin access to domain DNS settings
- Stripe webhook configuration permissions
- Supabase project owner or admin role
- Vercel team admin access

---

## Environment Setup

### Local Development Environment

```bash
# Clone the repository
git clone https://github.com/your-org/kct-menswear-v2.git
cd kct-menswear-v2

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
cp .env.example .env.local

# Install global tools
npm install -g vercel@latest
npm install -g supabase@latest
```

### Environment Variables Configuration

Create a comprehensive `.env.local` file for local development:

```env
# ================================
# NEXT.JS CONFIGURATION
# ================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="KCT Menswear"

# ================================
# SUPABASE CONFIGURATION
# ================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Direct URL (for migrations)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# ================================
# STRIPE CONFIGURATION
# ================================
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Enhanced products webhook (separate from legacy)
STRIPE_ENHANCED_WEBHOOK_SECRET=whsec_enhanced_webhook_secret

# ================================
# CDN & IMAGE CONFIGURATION
# ================================
CDN_BASE_URL=https://cdn.kctmenswear.com
R2_BUCKET_1_URL=https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev
R2_BUCKET_2_URL=https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev

# Cloudflare R2 (if using for uploads)
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=kct-enhanced-products

# ================================
# EMAIL CONFIGURATION
# ================================
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@kctmenswear.com
SENDGRID_FROM_NAME="KCT Menswear"

# ================================
# ANALYTICS CONFIGURATION
# ================================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345

# ================================
# SECURITY CONFIGURATION
# ================================
NEXTAUTH_SECRET=your_super_secure_nextauth_secret_here
NEXTAUTH_URL=https://your-production-domain.com

# JWT Secret for additional security
JWT_SECRET=your_jwt_secret_for_api_authentication

# ================================
# FEATURE FLAGS
# ================================
NEXT_PUBLIC_ENHANCED_PRODUCTS_ENABLED=true
NEXT_PUBLIC_HYBRID_SEARCH_ENABLED=true
NEXT_PUBLIC_ADMIN_PANEL_ENABLED=true
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# ================================
# RATE LIMITING
# ================================
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# ================================
# WEBHOOK CONFIGURATION
# ================================
WEBHOOK_SECRET=your_internal_webhook_secret
ADMIN_API_KEY=your_secure_admin_api_key

# ================================
# MONITORING & LOGGING
# ================================
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info

# ================================
# DEVELOPMENT FLAGS
# ================================
DEBUG_API_REQUESTS=true
VERBOSE_LOGGING=false
SKIP_BUILD_STATIC_GENERATION=false
```

### Production Environment Variables

For production deployment, set these in your Vercel dashboard:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://kctmenswear.com
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key
# ... other production values
```

---

## Supabase Configuration

### 1. Project Setup

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Pull remote schema
supabase db pull

# Generate TypeScript types
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

### 2. Database Migrations

Run the enhanced products migration:

```sql
-- Apply the enhanced products migration
-- File: supabase/migrations/002_enhanced_products.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enhanced products tables
-- (Full migration script is in the database schema documentation)

-- Verify migration success
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%enhanced%';
```

### 3. Row Level Security (RLS) Setup

```sql
-- Enable RLS on all enhanced tables
ALTER TABLE products_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews_enhanced ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- Public read access for active products
CREATE POLICY "Public can view active enhanced products"
ON products_enhanced FOR SELECT
USING (status = 'active');

-- Admin full access
CREATE POLICY "Admins can manage enhanced products"
ON products_enhanced FOR ALL
USING (
  auth.jwt() ->> 'role' = 'admin' OR
  auth.jwt() ->> 'email' IN (
    'admin@kctmenswear.com',
    'manager@kctmenswear.com'
  )
);

-- Authenticated users can view draft products (for preview)
CREATE POLICY "Authenticated users can preview products"
ON products_enhanced FOR SELECT
USING (
  status = 'active' OR 
  (auth.role() = 'authenticated' AND status = 'draft')
);
```

### 4. Database Functions and Triggers

```sql
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to enhanced products tables
CREATE TRIGGER update_products_enhanced_updated_at
  BEFORE UPDATE ON products_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create inventory calculation functions
CREATE OR REPLACE FUNCTION calculate_total_available_stock(product_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(available_count) 
     FROM product_variants_enhanced 
     WHERE product_id = product_uuid AND active = true),
    0
  );
END;
$$ LANGUAGE plpgsql;
```

### 5. Supabase Edge Functions (Optional)

Deploy edge functions for enhanced performance:

```bash
# Deploy the checkout function
supabase functions deploy create-checkout-secure

# Deploy the webhook handler
supabase functions deploy kct-webhook

# Set function secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_your_key
supabase secrets set WEBHOOK_SECRET=your_webhook_secret
```

---

## Stripe Integration Setup

### 1. Stripe Account Configuration

**Test Mode Setup:**
```bash
# Install Stripe CLI for webhook testing
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook endpoint
stripe trigger payment_intent.succeeded
```

**Production Setup:**

1. **Create Webhook Endpoint in Stripe Dashboard:**
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook signing secret

2. **Configure Enhanced Products Webhook:**
   - URL: `https://your-domain.com/api/stripe/enhanced-webhook`
   - Events: Enhanced product specific events
   - Separate signing secret

### 2. Product and Price Creation Strategy

```typescript
// Auto-create Stripe products for enhanced items
export async function createStripeProductForEnhanced(
  enhancedProduct: EnhancedProduct
): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  // Create Stripe Product
  const stripeProduct = await stripe.products.create({
    id: `enhanced_${enhancedProduct.id}`,
    name: enhancedProduct.name,
    description: enhancedProduct.short_description || enhancedProduct.description,
    images: [enhancedProduct.images.primary.cdn_url || enhancedProduct.images.primary.url],
    metadata: {
      kct_product_type: 'enhanced',
      kct_product_id: enhancedProduct.id,
      kct_category: enhancedProduct.category,
      kct_pricing_tier: enhancedProduct.pricing_tiers[0]?.tier_id?.toString() || '1'
    }
  });
  
  // Create Stripe Price
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: Math.round(enhancedProduct.base_price * 100),
    currency: 'usd',
    metadata: {
      kct_product_id: enhancedProduct.id,
      kct_base_price: enhancedProduct.base_price.toString()
    }
  });
  
  // Update enhanced product with Stripe IDs
  await supabase
    .from('products_enhanced')
    .update({
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id
    })
    .eq('id', enhancedProduct.id);
  
  return { product: stripeProduct, price: stripePrice };
}
```

### 3. Webhook Handlers

```typescript
// Enhanced webhook handler for new product events
// src/app/api/stripe/enhanced-webhook/route.ts
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
      process.env.STRIPE_ENHANCED_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { 
      status: 400 
    });
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleEnhancedCheckoutCompleted(event.data.object);
        break;
      
      case 'payment_intent.succeeded':
        await handleEnhancedPaymentSucceeded(event.data.object);
        break;
      
      default:
        console.log(`Unhandled enhanced event type: ${event.type}`);
    }
    
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Enhanced webhook handler error:', error);
    return new Response('Webhook handler error', { status: 500 });
  }
}
```

---

## Vercel Deployment

### 1. Project Configuration

**vercel.json Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "devCommand": "npm run dev",
  "functions": {
    "src/app/api/stripe/webhook/route.ts": {
      "maxDuration": 10
    },
    "src/app/api/stripe/enhanced-webhook/route.ts": {
      "maxDuration": 10
    },
    "src/app/api/products/search/route.ts": {
      "maxDuration": 20
    },
    "src/app/api/products/enhanced/route.ts": {
      "maxDuration": 15
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type,Authorization" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/admin",
      "destination": "/admin/dashboard",
      "permanent": false
    }
  ],
  "rewrites": [
    {
      "source": "/products/:slug",
      "destination": "/products/:slug"
    },
    {
      "source": "/api/products/enhanced/:id",
      "destination": "/api/products/enhanced/:id"
    }
  ]
}
```

### 2. Build Configuration

**next.config.ts:**
```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  
  // Image optimization
  images: {
    domains: [
      'cdn.kctmenswear.com',
      'pub-46371bda6faf4910b74631159fc2dfd4.r2.dev',
      'pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev'
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Performance optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
};

export default nextConfig;
```

### 3. Deployment Commands

```bash
# Install Vercel CLI globally
npm i -g vercel@latest

# Login to Vercel
vercel login

# Link project (first time only)
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

### 4. Automated Deployment with GitHub

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci --legacy-peer-deps
        
      - name: Build project
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

---

## CDN Configuration

### 1. Cloudflare CDN Setup

**DNS Configuration:**
```
# CNAME records for CDN
cdn.kctmenswear.com -> cloudflare-cdn-endpoint
images.kctmenswear.com -> r2-bucket-endpoint

# A records for main domain
kctmenswear.com -> vercel-ip-address
www.kctmenswear.com -> kctmenswear.com (CNAME)
```

**Cloudflare Page Rules:**
```
# Cache images aggressively
cdn.kctmenswear.com/*
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 1 week

# API routes - no cache
kctmenswear.com/api/*
- Cache Level: Bypass
- Disable Apps
- Disable Performance
```

### 2. Image Processing Pipeline

```typescript
// Cloudflare Worker for image optimization
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // Extract image parameters
  const width = url.searchParams.get('w');
  const height = url.searchParams.get('h');
  const quality = url.searchParams.get('q') || '80';
  const format = url.searchParams.get('f') || 'webp';
  
  // Build R2 URL
  const r2Url = `https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev${url.pathname}`;
  
  // Fetch and optimize image
  const imageResponse = await fetch(r2Url);
  
  if (!imageResponse.ok) {
    return new Response('Image not found', { status: 404 });
  }
  
  // Apply transformations
  const transformedImage = await transformImage(
    imageResponse,
    { width, height, quality, format }
  );
  
  return new Response(transformedImage, {
    headers: {
      'Content-Type': `image/${format}`,
      'Cache-Control': 'public, max-age=31536000',
      'CDN-Cache-Control': 'public, max-age=31536000'
    }
  });
}
```

---

## Database Migrations

### 1. Migration Scripts

Create comprehensive migration scripts:

```sql
-- Migration: 002_enhanced_products_complete.sql
-- Create all enhanced products tables with proper indexes and constraints

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Main enhanced products table
CREATE TABLE IF NOT EXISTS products_enhanced (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  
  -- Core pricing
  base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
  currency TEXT DEFAULT 'USD' NOT NULL,
  pricing_tiers JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Enhanced image system
  images JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Product content
  description TEXT NOT NULL,
  short_description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  care_instructions JSONB DEFAULT '[]'::jsonb,
  
  -- Specifications
  specifications JSONB DEFAULT '{}'::jsonb,
  
  -- Inventory
  inventory JSONB NOT NULL DEFAULT '{
    "total_stock": 0,
    "reserved_stock": 0,
    "available_stock": 0,
    "low_stock_threshold": 5,
    "allow_backorder": false
  }'::jsonb,
  
  -- SEO
  seo JSONB DEFAULT '{}'::jsonb,
  
  -- Status and flags
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  featured BOOLEAN DEFAULT false,
  trending BOOLEAN DEFAULT false,
  
  -- Stripe integration
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Comprehensive indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_category 
ON products_enhanced(category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_status 
ON products_enhanced(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_featured 
ON products_enhanced(featured) WHERE featured = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_trending 
ON products_enhanced(trending) WHERE trending = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_price 
ON products_enhanced(base_price);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_created_at 
ON products_enhanced(created_at DESC);

-- Full-text search index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_search 
ON products_enhanced USING gin(to_tsvector('english', name || ' ' || description));

-- JSONB indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_pricing_tiers 
ON products_enhanced USING gin(pricing_tiers);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_specifications 
ON products_enhanced USING gin(specifications);

-- Create additional tables (variants, reviews, collections)
-- ... (Full SQL would be extensive)

COMMIT;
```

### 2. Migration Deployment

```bash
# Run migrations on Supabase
supabase db push

# Verify migration success
supabase db ls

# Generate updated types
supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Test database connectivity
npm run test:db-connection
```

### 3. Data Seeding

```typescript
// scripts/seed-enhanced-products.ts
import { createClient } from '@supabase/supabase-js';
import { seedData } from './seed-data.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedEnhancedProducts() {
  console.log('Seeding enhanced products...');
  
  for (const productData of seedData.enhancedProducts) {
    try {
      const { data, error } = await supabase
        .from('products_enhanced')
        .insert([productData])
        .select()
        .single();
      
      if (error) {
        console.error(`Failed to seed product ${productData.name}:`, error);
        continue;
      }
      
      console.log(`✅ Seeded product: ${data.name}`);
      
      // Create corresponding Stripe product
      if (process.env.STRIPE_SECRET_KEY) {
        await createStripeProductForEnhanced(data);
      }
      
    } catch (error) {
      console.error(`Error seeding product ${productData.name}:`, error);
    }
  }
  
  console.log('Enhanced products seeding completed!');
}

// Run the seeding
if (require.main === module) {
  seedEnhancedProducts();
}
```

---

## Monitoring & Analytics

### 1. Application Performance Monitoring

**Vercel Analytics Integration:**
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**Custom Performance Monitoring:**
```typescript
// src/lib/analytics/performance.ts
export class PerformanceMonitor {
  static trackAPICall(endpoint: string, duration: number, status: number) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'api_call', {
        custom_map: {
          endpoint,
          duration,
          status
        }
      });
    }
  }
  
  static trackPageLoad(page: string, loadTime: number) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: page,
        page_load_time: loadTime
      });
    }
  }
  
  static trackProductView(productId: string, productType: 'enhanced' | 'legacy') {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        item_id: productId,
        item_category: productType,
        currency: 'USD'
      });
    }
  }
}
```

### 2. Error Tracking with Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Enhanced error context
  beforeSend(event) {
    // Add enhanced products context
    if (event.contexts) {
      event.contexts.enhanced_products = {
        enabled: process.env.NEXT_PUBLIC_ENHANCED_PRODUCTS_ENABLED === 'true',
        version: '1.0.0'
      };
    }
    return event;
  }
});
```

### 3. Health Check Endpoints

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'unknown',
      stripe: 'unknown',
      enhanced_products: 'unknown'
    }
  };
  
  try {
    // Test database connection
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products_enhanced')
      .select('count')
      .limit(1);
    
    healthCheck.services.database = error ? 'unhealthy' : 'healthy';
    
    // Test enhanced products API
    const enhancedResponse = await fetch('/api/products/enhanced?limit=1');
    healthCheck.services.enhanced_products = enhancedResponse.ok ? 'healthy' : 'unhealthy';
    
    // Overall status
    const allHealthy = Object.values(healthCheck.services).every(status => status === 'healthy');
    healthCheck.status = allHealthy ? 'healthy' : 'degraded';
    
    return NextResponse.json(healthCheck, { 
      status: allHealthy ? 200 : 503 
    });
    
  } catch (error) {
    healthCheck.status = 'unhealthy';
    return NextResponse.json(healthCheck, { status: 503 });
  }
}
```

---

## SSL & Security

### 1. SSL Certificate Configuration

**Automated SSL with Vercel:**
- Vercel automatically provides SSL certificates
- Custom domains require DNS verification
- Wildcard certificates for subdomains

**Manual SSL Configuration (if needed):**
```bash
# Generate Let's Encrypt certificate
certbot certonly --dns-cloudflare --dns-cloudflare-credentials ~/.secrets/certbot/cloudflare.ini -d kctmenswear.com -d *.kctmenswear.com
```

### 2. Security Headers

```typescript
// Security middleware
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // CSP for enhanced security
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://cdn.kctmenswear.com https://pub-*.r2.dev",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co",
    "frame-src https://js.stripe.com"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 3. API Security

```typescript
// API rate limiting middleware
// src/lib/middleware/rateLimiting.ts
import { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function rateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const ip = request.ip || 'anonymous';
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean old entries
  rateLimitMap.forEach((value, key) => {
    if (value.timestamp < windowStart) {
      rateLimitMap.delete(key);
    }
  });
  
  // Check current IP
  const ipData = rateLimitMap.get(ip) || { count: 0, timestamp: now };
  
  if (ipData.timestamp < windowStart) {
    // Reset window
    ipData.count = 1;
    ipData.timestamp = now;
  } else {
    ipData.count += 1;
  }
  
  rateLimitMap.set(ip, ipData);
  
  return {
    success: ipData.count <= limit,
    remaining: Math.max(0, limit - ipData.count),
    resetTime: ipData.timestamp + windowMs
  };
}
```

---

## Post-Deployment Verification

### 1. Automated Testing Suite

```bash
# Create comprehensive test script
# scripts/post-deploy-tests.js

const tests = [
  {
    name: 'Homepage loads',
    url: 'https://kctmenswear.com',
    expectedStatus: 200
  },
  {
    name: 'Enhanced products API',
    url: 'https://kctmenswear.com/api/products/enhanced',
    expectedStatus: 200,
    validateJson: true
  },
  {
    name: 'Hybrid search API',
    url: 'https://kctmenswear.com/api/products/search',
    method: 'POST',
    body: { search_term: 'suit' },
    expectedStatus: 200
  },
  {
    name: 'Health check',
    url: 'https://kctmenswear.com/api/health',
    expectedStatus: 200,
    validate: (response) => response.status === 'healthy'
  }
];

async function runTests() {
  console.log('Running post-deployment verification tests...');
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        method: test.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: test.body ? JSON.stringify(test.body) : undefined
      });
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ ${test.name}`);
      } else {
        console.log(`❌ ${test.name} - Expected ${test.expectedStatus}, got ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ ${test.name} - Error: ${error.message}`);
    }
  }
}

runTests();
```

### 2. Performance Verification

```bash
# Lighthouse CI for performance testing
npm install -g @lhci/cli

# Run Lighthouse audit
lhci autorun --upload.target=temporary-public-storage --collect.url=https://kctmenswear.com
```

### 3. Database Verification

```sql
-- Verify enhanced products tables
SELECT 
  table_name,
  table_rows
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%enhanced%';

-- Test enhanced products functionality
SELECT 
  id, name, status, created_at
FROM products_enhanced
WHERE status = 'active'
LIMIT 5;

-- Verify RLS policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename LIKE '%enhanced%';
```

---

## Rollback Procedures

### 1. Vercel Rollback

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>

# Or rollback to previous version
vercel rollback --previous
```

### 2. Database Rollback

```sql
-- Create rollback migration
-- supabase/migrations/003_rollback_enhanced_products.sql

BEGIN;

-- Disable enhanced products (emergency rollback)
UPDATE products_enhanced SET status = 'archived' WHERE status = 'active';

-- Or completely remove enhanced products system
-- DROP TABLE IF EXISTS products_enhanced CASCADE;
-- DROP TABLE IF EXISTS product_variants_enhanced CASCADE;
-- (Only in extreme cases)

COMMIT;
```

### 3. Feature Flag Rollback

```bash
# Disable enhanced products via environment variable
vercel env add NEXT_PUBLIC_ENHANCED_PRODUCTS_ENABLED false

# Redeploy with feature disabled
vercel --prod
```

---

## Troubleshooting

### Common Deployment Issues

**1. Build Failures:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Build locally first
npm run build
```

**2. Environment Variable Issues:**
```bash
# Check Vercel environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# Validate environment variables
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

**3. Database Connection Issues:**
```sql
-- Test database connection
SELECT current_database(), current_user, now();

-- Check table existence
\dt *enhanced*

-- Verify RLS policies
\d+ products_enhanced
```

**4. Stripe Integration Issues:**
```bash
# Test Stripe connection
stripe customers list --limit 1

# Verify webhook endpoints
stripe endpoints list

# Test webhook locally
stripe trigger checkout.session.completed
```

### Performance Issues

**1. Slow API Responses:**
```typescript
// Add API response time logging
console.time('API Response');
// ... API logic
console.timeEnd('API Response');
```

**2. Database Query Optimization:**
```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM products_enhanced WHERE category = 'suits';

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_category_status ON products_enhanced(category, status);
```

**3. Image Loading Issues:**
```typescript
// Test image URL accessibility
const testImageLoad = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
```

---

This comprehensive deployment guide provides everything needed to successfully deploy and maintain the KCT Menswear Enhanced Products System in a production environment. Follow each section carefully and verify each step to ensure a smooth deployment process.