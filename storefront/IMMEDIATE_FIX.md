# IMMEDIATE FIX - Both Projects

## The Issue
- SQL queries work in Supabase dashboard
- But API calls get "permission denied"
- This means RLS is still blocking the anon role

## Fix for BOTH Projects Right Now

### 1. Run This SQL in Supabase Dashboard
```sql
-- Disable RLS completely
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;
```

### 2. For Backend Project (Tell Claude in Cursor)
Create this file: `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gvcswimqaxvylgxbklbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Y3N3aW1xYXh2eWxneGJrbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NjA1MzAsImV4cCI6MjA2OTMzNjUzMH0.UZdiGcJXUV5VYetjWXV26inmbj2yXdiT03Z6t_5Lg24'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Replace ALL old Supabase code with this
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, images:product_images(*), variants:product_variants(*)')
  
  return { data: data || [], error }
}
```

### 3. Test Both Projects
- Main: http://localhost:3000/api/test-supabase
- Backend: Create similar test

## Key Points
- Use EXACT same credentials
- Disable RLS for now
- Get both reading first
- Then worry about security