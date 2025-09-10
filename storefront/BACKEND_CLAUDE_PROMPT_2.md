# 📝 Backend Claude - Next Steps

## Current Status
Main project Claude has identified that Supabase is working but RLS policies are blocking access. We need to sync both projects now.

## Your Tasks:

### 1. Copy the Shared Service File
Copy this EXACT file from the main project to your backend:
```bash
# Create the directory
mkdir -p src/lib/shared

# You'll need to create this file with the exact content from main project
# Path: src/lib/shared/supabase-products.ts
```

The file should be at: `/src/lib/shared/supabase-products.ts` in the main project.

### 2. Update Your Environment Variables
Make sure your `.env.local` has:
```env
VITE_PUBLIC_SUPABASE_URL=https://gvcswimqaxvylgxbklbz.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24
```

### 3. Update the Shared Service for Vite
Since you're using Vite (not Next.js), update the environment variable access in `supabase-products.ts`:

```typescript
// Change this:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// To this:
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY!;
```

### 4. Create a Test Component
Create `src/components/TestSupabase.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { testSupabaseConnection, fetchProductsWithImages } from '@/lib/shared/supabase-products';

export function TestSupabase() {
  const [status, setStatus] = useState('Testing...');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function test() {
      const result = await testSupabaseConnection();
      setStatus(result.success ? '✅ Connected' : `❌ ${result.error}`);
      
      if (result.success) {
        const productsResult = await fetchProductsWithImages({ limit: 5 });
        if (productsResult.success) {
          setProducts(productsResult.data);
        }
      }
    }
    test();
  }, []);

  return (
    <div>
      <h3>Supabase Status: {status}</h3>
      <p>Products found: {products.length}</p>
    </div>
  );
}
```

### 5. Find and Replace Old Queries
Search your codebase for these patterns and replace them:
- `supabase.from('products')` → Use shared service functions
- Any direct Supabase client creation → Use the shared service

### 6. Report Back
Let me know:
1. ✅/❌ Shared service file copied
2. ✅/❌ Environment variables updated
3. ✅/❌ Test component shows connection
4. Number of old queries found that need replacing

## ⚠️ Important Note
The main project is getting "permission denied" errors from Supabase. This means the RLS policies need to be fixed in the Supabase dashboard. Once that's resolved, both projects should work.