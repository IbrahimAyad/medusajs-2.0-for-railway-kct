# 📌 Instructions for Backend Claude (in Cursor)

## Your Mission
Fix the Supabase integration by implementing the EXACT same service pattern as the main project.

## Immediate Actions

### 1. Check Current Status
```bash
# Check if you have Supabase installed
npm list @supabase/supabase-js

# Check your environment variables
cat .env.local | grep SUPABASE
```

### 2. Create Shared Directory Structure
```bash
mkdir -p src/lib/shared
mkdir -p src/lib/supabase
```

### 3. Copy These Files EXACTLY

**File 1: `/src/lib/supabase/client.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

// Singleton instance
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });
  }

  return supabaseInstance;
}
```

**File 2: Copy `/src/lib/shared/supabase-products.ts` from the main project**
(It's too long to paste here, but it's in the main project)

### 4. Update Your `.env.local`
Make sure you have:
```
NEXT_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24
```

### 5. Test The Connection
Create a test file: `/src/app/api/test-connection/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { testSupabaseConnection, fetchProductsWithImages } from '@/lib/shared/supabase-products';

export async function GET() {
  const connection = await testSupabaseConnection();
  const products = await fetchProductsWithImages({ limit: 3 });
  
  return NextResponse.json({
    connection,
    productsFound: products.data.length,
    firstProduct: products.data[0] || null
  });
}
```

Then test: `curl http://localhost:3001/api/test-connection`

### 6. Find & Replace Old Methods

Search for these patterns and replace them:
- `supabase.from('products')` → Use `fetchProductsWithImages()`
- Direct Supabase client creation → Use `getSupabaseClient()`
- Custom image URL logic → Use `getProductImageUrl()`

## ⚠️ Current Issue
We're getting "permission denied for table products" because Supabase RLS policies need to be set up.

## 🎯 Success Checklist
- [ ] Shared service files copied exactly
- [ ] Environment variables set
- [ ] Test endpoint created
- [ ] Connection test passes
- [ ] Products fetch successfully
- [ ] Old methods replaced

## 📞 Coordination
Once you've implemented this, report back:
1. Connection status (working/failing)
2. Any errors you encounter
3. Number of products fetched

The main project Claude is waiting for your confirmation before proceeding!