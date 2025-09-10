# CDN Image Loading Issues - Troubleshooting Guide

## Current Problem
Images from `cdn.kctmenswear.com` are returning 404 errors and not loading on the website.

## DNS/Cloudflare Configuration Requirements

### 1. DNS Records Needed
You need to configure the following in your Cloudflare DNS settings:

#### Option A: If Using Cloudflare R2 Storage
```
Type: CNAME
Name: cdn
Target: public.r2.dev (or your R2 bucket URL)
Proxy: ON (Orange cloud)
```

#### Option B: If Using External CDN (AWS S3, etc.)
```
Type: CNAME
Name: cdn
Target: your-bucket.s3.amazonaws.com (or your CDN origin)
Proxy: OFF (Grey cloud - let CDN handle caching)
```

### 2. Cloudflare Page Rules (If Using Cloudflare Proxy)
Add these page rules for `cdn.kctmenswear.com/*`:
- **Cache Level**: Cache Everything
- **Edge Cache TTL**: 1 month
- **Browser Cache TTL**: 1 month
- **Always Online**: ON

### 3. Cloudflare Images Settings
In Cloudflare Dashboard > Images:
- Enable "Image Resizing" (requires Pro plan or higher)
- Set up transform rules for optimization
- Configure allowed origins

### 4. CORS Headers
Add these headers for `cdn.kctmenswear.com`:
```
Access-Control-Allow-Origin: https://kctmenswear.com
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 86400
```

## Verification Steps

### 1. Check DNS Propagation
```bash
nslookup cdn.kctmenswear.com
dig cdn.kctmenswear.com
```

### 2. Test Direct Access
Try accessing an image directly:
```
https://cdn.kctmenswear.com/test.jpg
```

### 3. Check SSL Certificate
Ensure SSL is active for the subdomain in Cloudflare:
- Dashboard > SSL/TLS > Edge Certificates
- Should show active certificate for `*.kctmenswear.com`

## Common Issues & Solutions

### Issue 1: 404 Errors
**Cause**: Files not uploaded to CDN origin
**Solution**: Upload images to your storage bucket/server

### Issue 2: SSL/HTTPS Errors
**Cause**: SSL not configured for subdomain
**Solution**: Enable Universal SSL in Cloudflare

### Issue 3: CORS Blocking
**Cause**: Cross-origin requests blocked
**Solution**: Add proper CORS headers (see above)

### Issue 4: Cloudflare Blocking
**Cause**: Security settings too strict
**Solution**: 
- Lower Security Level for `/cdn/*` path
- Add Page Rule to bypass security for images

## Alternative Solutions If DNS Not Accessible

### 1. Use Cloudflare Images API
```javascript
// Replace CDN URLs with Cloudflare Images
const imageUrl = `https://imagedelivery.net/${accountHash}/${imageId}/public`
```

### 2. Use External Image Service
- Uploadcare: `https://ucarecdn.com/`
- Cloudinary: `https://res.cloudinary.com/`
- ImageKit: `https://ik.imagekit.io/`

### 3. Temporary S3 Bucket
Create public S3 bucket with proper CORS:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["https://kctmenswear.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "MaxAgeSeconds": 3000,
    "AllowedHeaders": ["*"]
  }]
}
```

## Next Steps
1. Check current DNS configuration in Cloudflare
2. Verify where images are actually stored
3. Test direct image access via browser
4. Implement fallback image strategy
5. Consider using Next.js Image Optimization API as backup

## Contact Support
If DNS changes needed:
- Cloudflare Support: https://support.cloudflare.com
- Domain Registrar Support (if different from Cloudflare)