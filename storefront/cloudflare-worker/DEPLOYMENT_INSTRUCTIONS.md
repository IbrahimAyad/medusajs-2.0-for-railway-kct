# Cloudflare Image Transform Worker Deployment Guide

## Prerequisites
- Cloudflare account with Workers enabled
- Cloudflare Pro, Business, or Enterprise plan (for Image Resizing)
- Wrangler CLI installed (`npm install -g wrangler`)

## Setup Steps

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Update Configuration
Edit `wrangler.toml` and replace:
- `YOUR_ACCOUNT_ID` with your Cloudflare account ID
- Update the domain in routes to match your domain

### 4. Enable Cloudflare Image Resizing
1. Log into Cloudflare Dashboard
2. Go to your domain
3. Navigate to **Speed → Optimization → Image Resizing**
4. Enable "Image Resizing" (requires Pro plan or higher)
5. Enable "Resize images from any origin"

### 5. Deploy the Worker
```bash
cd cloudflare-worker
wrangler publish
```

### 6. Test the Worker
Test URL format:
```
https://kctmenswear.com/cdn-cgi/image/?width=400&quality=90&format=webp&url=https://cdn.kctmenswear.com/your-image.png
```

## How It Works

The worker intercepts image requests with transformation parameters and:
1. Parses the query parameters (width, height, quality, format, etc.)
2. Uses Cloudflare's Image Resizing API to transform the image
3. Returns the optimized image with proper caching headers
4. Falls back to original image if transformation fails

## Supported Parameters

- `width` - Resize width in pixels
- `height` - Resize height in pixels  
- `quality` - JPEG/WebP quality (1-100)
- `format` - Output format (auto, webp, avif, jpeg, png)
- `fit` - Resize mode (cover, contain, fill, inside, outside)
- `gravity` - Crop position (center, top, bottom, left, right)
- `sharpen` - Sharpen amount (0-10)
- `blur` - Blur amount (0-250)
- `dpr` - Device pixel ratio (1-3)
- `background` - Background color for transparent images

## Integration with Your App

The `OptimizedImage` component in your app will automatically use this worker when deployed. The URLs will be transformed from:

```
https://cdn.kctmenswear.com/image.png
```

To:

```
https://kctmenswear.com/cdn-cgi/image/?width=400&format=webp&url=https://cdn.kctmenswear.com/image.png
```

## Alternative: Using Transform Rules (Easier)

If you don't want to deploy a Worker, you can use Transform Rules:

1. Go to **Rules → Transform Rules → Rewrite URL**
2. Create a new rule:
   - **If**: URL path starts with `/images/`
   - **Then**: Rewrite to dynamic value with Image Resizing
3. Enable the rule

## Monitoring

View worker analytics in Cloudflare Dashboard:
- **Workers → Analytics** - Request count, errors, performance
- **Speed → Optimization** - Image bandwidth saved

## Costs

- **Workers**: 100,000 requests/day free, then $5/10 million requests
- **Image Resizing**: Included with Pro plan ($20/month)
- **R2 Storage**: $0.015 per GB/month
- **R2 Operations**: $0.36 per million requests

## Troubleshooting

### Images not loading
1. Check if Image Resizing is enabled in dashboard
2. Verify worker is deployed: `wrangler tail`
3. Check browser console for errors
4. Test direct worker URL

### Poor image quality
- Increase `quality` parameter (default is 85)
- Use `format=png` for images with text
- Adjust `sharpen` parameter for blurry images

### Slow loading
- Enable Cloudflare caching
- Use `format=auto` for automatic format selection
- Implement lazy loading in your app

## Local Development

Test the worker locally:
```bash
wrangler dev
```

Access at: `http://localhost:8787`

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Image Resizing Docs](https://developers.cloudflare.com/images/image-resizing/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/cli-wrangler/)