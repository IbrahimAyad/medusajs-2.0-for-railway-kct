# 🔧 Cursor - Fix Supabase RLS

## Immediate Action Required

Run this corrected SQL in your Supabase Dashboard SQL Editor:

```sql
-- QUICK FIX - Disable RLS temporarily to test
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_images DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- Test if it works
SELECT COUNT(*) as count FROM products;
```

If the count returns a number (not an error), then the connection is working!

## After Testing, Apply Proper Security

```sql
-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create simple public read policies
CREATE POLICY "public_read_products" ON products
FOR SELECT USING (true);

CREATE POLICY "public_read_images" ON product_images
FOR SELECT USING (true);

CREATE POLICY "public_read_variants" ON product_variants
FOR SELECT USING (true);

-- Verify policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'product_images', 'product_variants');
```

## Test After Fix

1. Visit: http://localhost:3000/api/test-supabase
2. Should see: `{"success": true, "productsFound": 3, ...}`

3. Visit: http://localhost:3000/test-products
4. Should see products displayed

## Current Issue
- Supabase connection is working ✅
- Environment variables are correct ✅
- RLS policies are blocking access ❌
- Need to run the SQL above to fix ⚠️