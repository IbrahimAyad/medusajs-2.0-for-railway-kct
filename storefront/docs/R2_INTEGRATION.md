# Cloudflare R2 Integration for Style Swiper

This document outlines the integration of Cloudflare R2 for the Style Swiper feature, enabling fast, scalable image storage and delivery.

## Overview

The Style Swiper R2 integration provides:
- **Global CDN delivery** for lightning-fast image loading
- **Smart categorization** of style images
- **Product linking** capabilities
- **Analytics tracking** for style preferences
- **Admin interface** for easy image management

## Setup Instructions

### 1. Create R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to R2 Storage
3. Create a new bucket named `style-swipe`
4. Enable public access if desired (recommended for better performance)

### 2. Generate API Credentials

1. Go to [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Create a new API token with the following permissions:
   - Account → R2 → Edit
3. Save your credentials:
   - Access Key ID (32 characters)
   - Secret Access Key (64 characters)

### 3. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.r2.example .env.local
```

Update with your credentials:
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
NEXT_PUBLIC_R2_BUCKET_NAME=style-swipe
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-your-bucket-id.r2.dev
```

### 4. Set CORS Policy (if needed)

For public buckets, add CORS rules in the R2 dashboard:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

## Usage

### Admin Interface

Access the admin interface at `/admin/style-swiper` to:
- Upload new style images
- Organize by categories
- Delete unwanted images
- Preview uploaded content

### API Endpoints

#### Upload Image
```typescript
POST /api/style-swiper/upload
Content-Type: multipart/form-data

{
  file: File,
  category: string
}
```

#### List Images
```typescript
GET /api/style-swiper/images?category=suits
```

#### Delete Image
```typescript
DELETE /api/style-swiper/images
Content-Type: application/json

{
  key: string
}
```

### Components

#### R2StyleSwiper
The main swiper component with R2 integration:

```tsx
import { R2StyleSwiper } from '@/components/style/R2StyleSwiper';

<R2StyleSwiper
  category="suits"
  onSwipe={(image, direction, velocity) => {
    // Handle swipe
  }}
  onComplete={(likedImages, analytics) => {
    // Handle completion
  }}
  onProductClick={(productId) => {
    // Handle product click
  }}
/>
```

## Image Organization

### Categories
- `suits` - Suits & Tuxedos
- `shirts` - Dress Shirts
- `accessories` - Ties, Bowties, Cufflinks
- `shoes` - Dress Shoes
- `trending` - Current Fashion Trends
- `seasonal` - Seasonal Collections

### Metadata Structure
Each image can include metadata:
```typescript
{
  productId?: string,      // Link to product
  tags?: string[],         // Style tags
  colors?: string[],       // Color palette
  occasions?: string[],    // Event types
  season?: string,         // Season
  style?: string          // Style category
}
```

## Performance Optimization

### Image Variants (Future Enhancement)
The system is designed to support multiple image variants:
- `thumbnail` - 200x200 @ 80% quality
- `card` - 400x500 @ 85% quality
- `swiper` - 600x800 @ 90% quality
- `full` - 1200x1600 @ 95% quality

### Best Practices
1. **Image Format**: Use WebP or AVIF for better compression
2. **Image Size**: Keep original images under 5MB
3. **Aspect Ratio**: Maintain 3:4 ratio for best display
4. **Naming**: Use descriptive filenames for SEO

## Analytics Integration

The swiper tracks:
- Total swipes
- Like/dislike ratio
- Average swipe time
- Swipe velocity
- Category preferences
- Undo patterns

## Security Considerations

1. **API Keys**: Never expose secret keys in client code
2. **Upload Validation**: Validate file types and sizes
3. **Access Control**: Implement proper authentication for admin routes
4. **Rate Limiting**: Add rate limits to upload endpoints

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check R2 credentials
   - Verify bucket exists
   - Check file size limits

2. **Images Not Loading**
   - Verify public access settings
   - Check CORS configuration
   - Confirm URL format

3. **Slow Performance**
   - Enable Cloudflare caching
   - Optimize image sizes
   - Use appropriate formats

## Future Enhancements

1. **AI-Powered Analysis**
   - Automatic color extraction
   - Style classification
   - Trend detection

2. **Smart Recommendations**
   - Based on swipe patterns
   - Seasonal suggestions
   - Personalized collections

3. **Advanced Features**
   - Batch upload interface
   - Image editing tools
   - A/B testing capabilities