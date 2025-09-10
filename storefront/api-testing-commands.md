# API Testing Commands

This document contains curl commands and testing instructions to verify your KCT Menswear application's database connectivity and API endpoints.

## Prerequisites

1. Make sure your development server is running:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Your server should be running on `http://localhost:3000` (or the port shown in your terminal)

## Test Commands

### 1. Basic Health Check

Test the basic API functionality:

```bash
curl -X GET http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Expected Response:**
```json
{
  "message": "Test endpoint working",
  "timestamp": "2025-01-XX..."
}
```

### 2. Supabase Connection Test

Test your Supabase database connection and RLS policies:

```bash
curl -X GET http://localhost:3000/api/supabase/test \
  -H "Content-Type: application/json" \
  | jq '.'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Supabase connection successful!",
  "timestamp": "2025-01-XX...",
  "data": {
    "counts": {
      "products": 10,
      "variants": 25,
      "images": 15,
      "collections": 5
    },
    "sampleProducts": [
      {
        "id": "gid://shopify/Product/...",
        "title": "Sample Product",
        "status": "active"
      }
    ],
    "connection": {
      "url": "https://your-project.supabase.co...",
      "keyLength": 195
    }
  }
}
```

**If you get an error, common issues:**

- **Missing environment variables:**
  ```json
  {
    "success": false,
    "error": "Missing Supabase environment variables"
  }
  ```
  **Fix:** Check your `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

- **RLS policy blocking:**
  ```json
  {
    "success": false,
    "error": "Database query failed",
    "details": {
      "message": "new row violates row-level security policy"
    }
  }
  ```
  **Fix:** Check your RLS policies in Supabase

### 3. Products API Test

Test the products endpoint:

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  | jq '.'
```

### 4. Individual Product Test

Test fetching a specific product (replace `PRODUCT_ID` with an actual ID from your database):

```bash
curl -X GET http://localhost:3000/api/products/PRODUCT_ID \
  -H "Content-Type: application/json" \
  | jq '.'
```

## Testing with Different Tools

### Using HTTPie (if installed)

```bash
# Basic test
http GET localhost:3000/api/test

# Supabase test
http GET localhost:3000/api/supabase/test

# Products test
http GET localhost:3000/api/products
```

### Using Postman

1. Create a new GET request
2. URL: `http://localhost:3000/api/supabase/test`
3. Headers: `Content-Type: application/json`
4. Send the request

### Using your browser

Simply visit these URLs in your browser:

- http://localhost:3000/api/test
- http://localhost:3000/api/supabase/test
- http://localhost:3000/api/products

## What Each Response Means

### Supabase Test Endpoint

**✅ Success Indicators:**
- `success: true`
- Product count matches your expected number (10 or 39)
- Sample products are returned
- No error messages

**❌ Failure Indicators:**
- `success: false`
- Error messages about RLS policies
- Missing environment variables
- Connection timeouts

### Products API Endpoint

**✅ Success Indicators:**
- Returns an array of products
- Each product has expected fields (id, title, handle, etc.)
- HTTP status 200

**❌ Failure Indicators:**
- Empty array when you expect products
- Error messages
- HTTP status 400/500

## Troubleshooting

### If Supabase test fails:

1. **Check environment variables:**
   ```bash
   # In your project root
   cat .env | grep SUPABASE
   ```

2. **Verify RLS policies in Supabase dashboard:**
   - Go to Authentication > Policies
   - Make sure you have policies for `products`, `product_variants`, `product_images`, `collections`
   - Policies should allow SELECT for anonymous users

3. **Check database connectivity:**
   - Run the SQL queries from `database-verification-queries.sql` in your Supabase SQL editor

### If Products API fails:

1. **Check the products API implementation:**
   ```bash
   cat src/app/api/products/route.ts
   ```

2. **Look at server logs:**
   - Check your terminal where `npm run dev` is running
   - Look for error messages

## Advanced Testing

### Load Testing

Test with multiple concurrent requests:

```bash
# Install apache bench if needed
# brew install httpd (macOS)

# Test with 10 concurrent requests, 100 total
ab -n 100 -c 10 http://localhost:3000/api/supabase/test
```

### Test with Authentication Headers

If you need to test with authentication:

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

## Next Steps

After successful testing:

1. ✅ **All endpoints return 200 OK** → Your API is working
2. ✅ **Supabase test shows correct product count** → Database connection is working
3. ✅ **Products API returns data** → Your application can fetch products
4. ❌ **Any endpoint fails** → Check the specific error message and follow troubleshooting steps

## Production Testing

When testing on production (replace with your actual domain):

```bash
# Test production Supabase connection
curl -X GET https://your-domain.vercel.app/api/supabase/test \
  -H "Content-Type: application/json" \
  | jq '.'
```

Remember to check that your production environment variables are set correctly in Vercel.