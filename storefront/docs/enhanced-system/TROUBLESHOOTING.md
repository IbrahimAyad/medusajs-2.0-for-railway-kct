# KCT Menswear Enhanced Products System - Troubleshooting Guide

**Troubleshooting Version:** 1.0  
**Last Updated:** August 15, 2025  
**Support Level:** Production Critical

## Table of Contents

1. [Build Errors & Fixes](#build-errors--fixes)
2. [Database Connection Issues](#database-connection-issues)
3. [Image Loading Problems](#image-loading-problems)
4. [Checkout Failures](#checkout-failures)
5. [Performance Bottlenecks](#performance-bottlenecks)
6. [Browser Compatibility](#browser-compatibility)
7. [API Issues](#api-issues)
8. [Authentication Problems](#authentication-problems)
9. [Deployment Issues](#deployment-issues)
10. [Emergency Procedures](#emergency-procedures)

---

## Build Errors & Fixes

### TypeScript Compilation Errors

**Error:** `Type 'EnhancedProduct' is not assignable to type 'UnifiedProduct'`

**Cause:** Type mismatch between enhanced and legacy product systems

**Solution:**
```typescript
// Fix type unions in hybrid components
interface HybridProductProps {
  product: EnhancedProduct | UnifiedProduct;
}

// Type guard function
function isEnhancedProduct(product: any): product is EnhancedProduct {
  return 'pricing_tiers' in product && Array.isArray(product.pricing_tiers);
}

// Usage in component
const ProductDisplay = ({ product }: HybridProductProps) => {
  if (isEnhancedProduct(product)) {
    // Handle enhanced product
    return <EnhancedProductCard product={product} />;
  } else {
    // Handle legacy product
    return <LegacyProductCard product={product} />;
  }
};
```

---

**Error:** `Module '"@/lib/supabase/database.types"' has no exported member 'Database'`

**Cause:** Supabase types not generated or outdated

**Solution:**
```bash
# Regenerate Supabase types
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts

# Or from remote (production)
npx supabase gen types typescript --project-id your-project-id > src/lib/supabase/database.types.ts

# Verify types are exported correctly
head -20 src/lib/supabase/database.types.ts
```

---

**Error:** `Cannot find module 'sharp'`

**Cause:** Sharp module missing or incorrectly installed

**Solution:**
```bash
# Remove and reinstall sharp
npm uninstall sharp
npm install sharp

# For Vercel deployment issues
npm install sharp --platform=linux --arch=x64

# Alternative: Use Next.js experimental config
# next.config.ts
experimental: {
  serverComponentsExternalPackages: ['sharp']
}
```

---

### Next.js Build Failures

**Error:** `Error: ENOENT: no such file or directory, open '.next/static/chunks/pages/api/products/enhanced/route.js'`

**Cause:** API route structure conflicts

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Check API route structure
ls -la src/app/api/products/enhanced/

# Ensure proper route file naming
# ✅ Correct: route.ts
# ❌ Incorrect: index.ts, api.ts

# Rebuild
npm run build
```

---

**Error:** `Module not found: Can't resolve '@/components/...'`

**Cause:** Path mapping configuration issue

**Solution:**
```typescript
// tsconfig.json - verify path mapping
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"]
    }
  }
}

// Alternative: Use relative imports temporarily
import { ProductCard } from '../../components/products/ProductCard';
```

---

### Environment Variable Issues

**Error:** `ReferenceError: process is not defined`

**Cause:** Server-side environment variables used in client components

**Solution:**
```typescript
// ❌ Wrong: Server variable in client component
export default function ClientComponent() {
  const dbUrl = process.env.SUPABASE_SERVICE_ROLE_KEY; // Error!
}

// ✅ Correct: Use public variables for client
export default function ClientComponent() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// ✅ Or pass from server component
export default function ServerComponent() {
  const serverData = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return <ClientComponent data={serverData} />;
}
```

---

## Database Connection Issues

### Supabase Connection Failures

**Error:** `Failed to connect to database`

**Diagnostic Steps:**
```typescript
// Test connection script - save as scripts/test-db-connection.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('products_enhanced')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database error:', error);
      
      // Common error diagnostics
      if (error.message.includes('relation "products_enhanced" does not exist')) {
        console.log('❌ Enhanced products table not created');
        console.log('Run: npx supabase db push');
      } else if (error.message.includes('permission denied')) {
        console.log('❌ RLS policy blocking access');
        console.log('Check RLS policies on products_enhanced table');
      }
    } else {
      console.log('✅ Database connection successful');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testConnection();
```

**Common Solutions:**

1. **Invalid URL/Key:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Get correct values from Supabase dashboard
# Settings > API > Project URL & anon key
```

2. **Table Not Found:**
```sql
-- Run in Supabase SQL editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'products_enhanced';

-- If empty, run migration
-- npx supabase db push
```

3. **RLS Policy Issues:**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'products_enhanced';

-- Create basic public read policy if missing
CREATE POLICY "Allow public read" ON products_enhanced 
FOR SELECT USING (true);
```

---

### Migration Failures

**Error:** `Migration failed: syntax error at or near "JSONB"`

**Cause:** PostgreSQL version compatibility

**Solution:**
```sql
-- Check PostgreSQL version
SELECT version();

-- Ensure using PostgreSQL 12+ for JSONB support
-- If older version, update Supabase project or use JSON instead

-- Alternative for older versions:
ALTER TABLE products_enhanced 
ALTER COLUMN pricing_tiers TYPE JSON USING pricing_tiers::JSON;
```

---

**Error:** `Permission denied for table products_enhanced`

**Cause:** Insufficient database permissions

**Solution:**
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Reset RLS policies
DROP POLICY IF EXISTS "Public can view active products" ON products_enhanced;
CREATE POLICY "Public read access" ON products_enhanced FOR SELECT USING (true);
```

---

## Image Loading Problems

### CDN Fallback Issues

**Problem:** Images not loading, showing placeholder instead

**Diagnostic Script:**
```typescript
// scripts/test-image-loading.ts
const testUrls = [
  'https://cdn.kctmenswear.com/products/test.webp',
  'https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/test.webp',
  'https://pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev/test.webp'
];

async function testImageUrls() {
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`${url}: ${response.ok ? '✅' : '❌'} (${response.status})`);
    } catch (error) {
      console.log(`${url}: ❌ Error - ${error.message}`);
    }
  }
}

testImageUrls();
```

**Solutions:**

1. **CDN Configuration:**
```typescript
// Fix image helper function
export function getOptimizedImageUrl(
  image: ProductImage | string,
  size: keyof ResponsiveImageSet = 'large',
  fallbackEnabled: boolean = true
): string {
  if (typeof image === 'string') {
    return image;
  }
  
  // Priority 1: CDN with responsive sizing
  if (image.cdn_url && image.responsive_urls?.[size]) {
    return image.responsive_urls[size];
  }
  
  // Priority 2: CDN base URL
  if (image.cdn_url) {
    return image.cdn_url;
  }
  
  // Priority 3: R2 fallback
  if (fallbackEnabled && image.url) {
    return image.url;
  }
  
  // Priority 4: Placeholder
  return '/placeholder-product.svg';
}
```

2. **CORS Configuration:**
```javascript
// In Cloudflare Workers or CDN settings
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

3. **Next.js Image Configuration:**
```typescript
// next.config.ts
module.exports = {
  images: {
    domains: [
      'cdn.kctmenswear.com',
      'pub-46371bda6faf4910b74631159fc2dfd4.r2.dev',
      'pub-8ea0502158a94b8ca8a7abb9e18a57e8.r2.dev'
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  }
};
```

---

### Image Upload Failures

**Error:** `Failed to upload image to CDN`

**Solution:**
```typescript
// Robust image upload with retry
async function uploadImageWithRetry(
  imageFile: File,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData
        }
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      return result.url;
      
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}
```

---

## Checkout Failures

### Stripe Integration Issues

**Error:** `No such price: price_xxxxx`

**Cause:** Enhanced product Stripe price not created

**Diagnostic:**
```typescript
// Check if Stripe price exists for enhanced product
async function checkStripePrice(productId: string) {
  const { data: product } = await supabase
    .from('products_enhanced')
    .select('stripe_price_id, base_price, name')
    .eq('id', productId)
    .single();
  
  if (!product?.stripe_price_id) {
    console.log('❌ No Stripe price ID for product:', product?.name);
    console.log('Creating Stripe price...');
    
    // Create Stripe price
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    
    const stripePrice = await stripe.prices.create({
      product: `enhanced_${productId}`,
      unit_amount: Math.round(product.base_price * 100),
      currency: 'usd',
    });
    
    // Update database
    await supabase
      .from('products_enhanced')
      .update({ stripe_price_id: stripePrice.id })
      .eq('id', productId);
    
    console.log('✅ Stripe price created:', stripePrice.id);
  } else {
    console.log('✅ Stripe price exists:', product.stripe_price_id);
  }
}
```

**Solution:**
```typescript
// Auto-create Stripe products for enhanced items
export async function ensureStripeProduct(enhancedProduct: EnhancedProduct) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  
  // Check if Stripe product exists
  if (!enhancedProduct.stripe_product_id) {
    const stripeProduct = await stripe.products.create({
      id: `enhanced_${enhancedProduct.id}`,
      name: enhancedProduct.name,
      description: enhancedProduct.short_description,
      images: [enhancedProduct.images.primary.cdn_url],
      metadata: {
        kct_product_type: 'enhanced',
        kct_product_id: enhancedProduct.id
      }
    });
    
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(enhancedProduct.base_price * 100),
      currency: 'usd'
    });
    
    // Update database
    await supabase
      .from('products_enhanced')
      .update({
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id
      })
      .eq('id', enhancedProduct.id);
  }
}
```

---

### Cart Issues

**Problem:** Cart items disappearing on page refresh

**Cause:** Local storage not properly synced

**Solution:**
```typescript
// Fix cart persistence
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find(item => 
          item.productId === newItem.productId && 
          JSON.stringify(item.selectedVariants) === JSON.stringify(newItem.selectedVariants)
        );
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === existingItem.id
                ? { ...item, quantity: item.quantity + newItem.quantity }
                : item
            )
          });
        } else {
          set({
            items: [...items, { ...newItem, id: generateId() }]
          });
        }
      },
      
      hydrate: () => {
        // Force hydration from localStorage
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('kct-cart-storage');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              set({ items: parsed.state?.items || [] });
            } catch (error) {
              console.error('Failed to hydrate cart:', error);
              localStorage.removeItem('kct-cart-storage');
            }
          }
        }
      }
    }),
    {
      name: 'kct-cart-storage',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        console.log('Cart rehydrated:', state?.items?.length || 0, 'items');
      }
    }
  )
);

// Use in main layout
export default function Layout({ children }) {
  const hydrate = useCartStore(state => state.hydrate);
  
  useEffect(() => {
    hydrate();
  }, [hydrate]);
  
  return <>{children}</>;
}
```

---

## Performance Bottlenecks

### Slow API Responses

**Issue:** API calls taking >2 seconds

**Diagnostic:**
```typescript
// Add performance monitoring to API routes
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    // API logic here
    const result = await fetchProducts();
    
    const duration = performance.now() - startTime;
    console.log(`API response time: ${duration.toFixed(2)}ms`);
    
    // Alert if slow
    if (duration > 2000) {
      console.warn('Slow API response detected:', {
        endpoint: request.url,
        duration,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error('API error after', duration, 'ms:', error);
    throw error;
  }
}
```

**Solutions:**

1. **Database Query Optimization:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_enhanced_category_status 
ON products_enhanced(category, status) WHERE status = 'active';

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT id, name, base_price, images->>'primary' as primary_image
FROM products_enhanced 
WHERE category = 'suits' 
  AND status = 'active' 
ORDER BY created_at DESC 
LIMIT 20;
```

2. **React Query Caching:**
```typescript
// Implement aggressive caching
export function useEnhancedProducts(query: EnhancedProductQuery = {}) {
  return useQuery({
    queryKey: ['enhanced-products', query],
    queryFn: () => fetchEnhancedProducts(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });
}
```

3. **API Response Compression:**
```typescript
// Compress large responses
import { NextResponse } from 'next/server';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export async function GET(request: NextRequest) {
  const data = await getLargeDataset();
  
  if (data.length > 1000) { // Large response
    const compressed = await gzipAsync(JSON.stringify(data));
    
    return new NextResponse(compressed, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip'
      }
    });
  }
  
  return NextResponse.json(data);
}
```

---

### Memory Leaks

**Issue:** Application consuming excessive memory

**Solution:**
```typescript
// Fix common React memory leaks

// 1. Cleanup event listeners
useEffect(() => {
  const handleScroll = () => { /* handler */ };
  window.addEventListener('scroll', handleScroll);
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []);

// 2. Cancel async operations
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    const data = await api.getData();
    if (!cancelled) {
      setData(data);
    }
  };
  
  fetchData();
  
  return () => {
    cancelled = true;
  };
}, []);

// 3. Clear timeouts/intervals
useEffect(() => {
  const timer = setTimeout(() => {
    // Some action
  }, 1000);
  
  return () => clearTimeout(timer);
}, []);
```

---

## Browser Compatibility

### Safari Issues

**Problem:** Images not loading in Safari

**Solution:**
```typescript
// Safari-compatible image component
export function SafariCompatibleImage({ src, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // Safari-specific image preloading
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setHasError(false);
    };
    img.onerror = () => {
      setHasError(true);
      // Fallback to R2 bucket for Safari
      const fallbackSrc = src.replace('cdn.kctmenswear.com', 'pub-46371bda6faf4910b74631159fc2dfd4.r2.dev');
      setImageSrc(fallbackSrc);
    };
    img.src = src;
  }, [src]);
  
  if (hasError) {
    return <div className="bg-gray-200 animate-pulse" {...props} />;
  }
  
  return <img src={imageSrc} alt={alt} {...props} />;
}
```

---

### Internet Explorer (if needed)

**Problem:** ES6+ features not supported

**Solution:**
```javascript
// next.config.ts
module.exports = {
  transpilePackages: ['some-es6-package'],
  compiler: {
    // Ensure ES5 compatibility
    forceSwcTransforms: true,
  },
  swcMinify: true,
};

// Add polyfills
// pages/_app.tsx
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

---

## API Issues

### Rate Limiting Problems

**Error:** `429 Too Many Requests`

**Solution:**
```typescript
// Implement exponential backoff
async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      if (error.status === 429 && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error(`API call failed after ${maxRetries} attempts`);
}

// Usage
const products = await apiCallWithRetry(() =>
  fetch('/api/products/enhanced').then(r => r.json())
);
```

---

### CORS Issues

**Error:** `Access to fetch blocked by CORS policy`

**Solution:**
```typescript
// Add CORS headers to API routes
// src/app/api/products/enhanced/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
```

---

## Authentication Problems

### Session Expiration

**Issue:** Users getting logged out frequently

**Solution:**
```typescript
// Extend session and add refresh logic
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// Add session refresh hook
export function useAuthSession() {
  const [session, setSession] = useState(null);
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Session refreshed');
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Clear any cached data
          queryClient.clear();
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return session;
}
```

---

## Deployment Issues

### Vercel Build Failures

**Error:** `Build exceeded maximum duration`

**Solution:**
```bash
# Optimize build process
# package.json
{
  "scripts": {
    "build": "next build",
    "build:fast": "SKIP_BUILD_STATIC_GENERATION=true next build"
  }
}

# Increase timeout in vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "maxDuration": 300
      }
    }
  ]
}
```

---

**Error:** `Function exceeded maximum size`

**Solution:**
```typescript
// Split large API routes
// Instead of one large route, split into smaller ones

// api/products/enhanced/list/route.ts - for listing
// api/products/enhanced/search/route.ts - for search
// api/products/enhanced/manage/route.ts - for CRUD

// Use dynamic imports
const { processLargeData } = await import('./large-processor');
```

---

## Emergency Procedures

### System-Wide Outage

**Immediate Response:**
```bash
# 1. Check system status
curl -I https://kctmenswear.com/api/health

# 2. Check Vercel status
vercel ls

# 3. Emergency rollback
vercel rollback --previous

# 4. Disable enhanced products if needed
vercel env add NEXT_PUBLIC_ENHANCED_PRODUCTS_ENABLED false
vercel --prod
```

**Database Emergency:**
```sql
-- Emergency read-only mode
ALTER DATABASE your_db SET default_transaction_read_only = on;

-- Disable enhanced products table access
REVOKE ALL ON products_enhanced FROM public;

-- Re-enable when fixed
ALTER DATABASE your_db SET default_transaction_read_only = off;
GRANT SELECT ON products_enhanced TO public;
```

---

### Data Corruption

**Recovery Steps:**
```sql
-- 1. Assess damage
SELECT COUNT(*) as total_products FROM products_enhanced;
SELECT COUNT(*) as active_products FROM products_enhanced WHERE status = 'active';

-- 2. Backup current state
CREATE TABLE products_enhanced_backup AS 
SELECT * FROM products_enhanced;

-- 3. Restore from backup (if available)
-- Use Supabase dashboard point-in-time recovery

-- 4. Validate data integrity
SELECT id, name, base_price 
FROM products_enhanced 
WHERE base_price IS NULL OR base_price <= 0;
```

---

### Contact Support

**Emergency Contacts:**
- **System Administrator:** admin@kctmenswear.com
- **Database Issues:** Supabase Support Dashboard
- **Payment Issues:** Stripe Support Dashboard
- **CDN Issues:** Cloudflare Support

**Information to Include:**
- Error messages (full stack traces)
- Steps to reproduce
- Browser/device information
- Time of occurrence
- Affected user accounts (if applicable)

---

This comprehensive troubleshooting guide covers the most common issues you'll encounter with the KCT Menswear Enhanced Products System. Keep this document updated as new issues are discovered and resolved.