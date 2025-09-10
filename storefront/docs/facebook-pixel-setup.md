# Facebook Pixel & Business Marketing API Setup - Complete Implementation Guide

## Overview

The Facebook Pixel and Business Marketing API have been fully integrated into the KCT Menswear e-commerce platform. This implementation provides comprehensive tracking for:

- Product views and engagement
- Add to cart events
- Checkout initiation
- Purchase completion
- User behavior and custom events
- Advanced matching for improved conversion tracking

## Configuration

### Environment Variables

The following environment variables have been configured:

```env
# Facebook Business API
NEXT_PUBLIC_FB_APP_ID=600272069409397
NEXT_PUBLIC_FB_PIXEL_ID=1409898642574301
# Optional: For Conversion API (server-side tracking)
FB_ACCESS_TOKEN=your_facebook_access_token
```

### Business Account Details

- **Business Portfolio ID**: 1935361121530439
- **Ad Account ID**: 1409898642574301
- **App ID**: 600272069409397
- **Client Token**: f296cad6d16fbf985116e940d41ea51d
- **Dataset ID**: 283546658844002
- **App Secret**: 6e1c702c56290016ffa5c8320017b363 (Server-side only!)
- **API Version**: v22.0
- **Website**: kctmenswear.com

## Important Security Notes

⚠️ **NEVER expose these credentials client-side:**
- `FB_APP_SECRET` (6e1c702c56290016ffa5c8320017b363)
- `FB_ACCESS_TOKEN` (when obtained)

These should only be used in server-side code for Conversion API implementation.

## Implementation Details

### 1. Core Files

- **`/src/lib/analytics/facebook-pixel.ts`** - Main Facebook Pixel implementation
  - SDK initialization with v22.0 API
  - Standard event tracking functions
  - Custom event tracking
  - Advanced matching capabilities
  - Social sharing integration
  - Client token integration

- **`/src/lib/analytics/FacebookTrackingService.ts`** - Enhanced tracking service
  - Singleton pattern for consistent tracking
  - SDK event tracking (FB.AppEvents)
  - Pixel event tracking (fbq)
  - KCT-specific business events
  - Unified tracking interface

- **`/src/components/analytics/FacebookPixel.tsx`** - React component for Pixel initialization
  - Automatic page view tracking
  - Route change detection
  - Pixel script injection

- **`/src/hooks/useFacebookTracking.ts`** - React hooks for tracking
  - Automatic high-value page tracking
  - Engagement time tracking
  - Special event interest tracking

- **`/src/components/chat/FacebookMessenger.tsx`** - Customer chat integration
  - Facebook Messenger plugin
  - Real-time customer support
  - Branded with KCT gold theme

### 2. Tracking Events Implemented

#### Standard Events
- **PageView** - Automatically tracked on every page
- **ViewContent** - Product detail page views
- **AddToCart** - When items are added to cart
- **InitiateCheckout** - When checkout process begins
- **Purchase** - Order completion (requires server-side implementation)
- **Search** - Product searches
- **AddToWishlist** - Wishlist additions
- **CompleteRegistration** - Account creation
- **Lead** - Form submissions
- **Subscribe** - Newsletter signups

#### Custom Events
- **ProductEngagement** - Time spent on product pages
- **VideoView** - Product video interactions
- **SizeGuideView** - Size guide interactions
- **BundleView** - Bundle product views
- **StyleQuizStarted** - Style quiz engagement
- **StyleQuizCompleted** - Quiz completion with preferences
- **WeddingInterest** - Wedding-related page engagement
- **PromInterest** - Prom collection interest
- **HighValuePageView** - Premium collection views
- **SizeBotInteraction** - AI sizing tool usage
- **VisualSearchUsed** - Fashion-CLIP visual search
- **VideoEngagement** - Video watch time tracking

### 3. Enhanced Features

#### Advanced Matching
Improves conversion tracking by matching more website visitors to Facebook users:

```typescript
setUserData({
  em: 'user@email.com', // Email (hashed automatically)
  fn: 'John',           // First name
  ln: 'Doe',            // Last name
  ph: '1234567890',     // Phone
  external_id: 'user123' // Your user ID
});
```

#### Facebook Login Integration
OAuth login functionality for streamlined user authentication:

```typescript
const userData = await loginWithFacebook();
```

#### Social Sharing
Product sharing functionality with tracking:

```typescript
shareOnFacebook(productUrl, productDescription);
```

## Analytics Dashboard

The development analytics dashboard has been enhanced to show both Google Analytics and Facebook Pixel events in real-time:

- **GA4 Events** - Green badge
- **Facebook Events** - Blue badge with FB icon
- Event parameters visible for debugging
- Clear functionality to reset event log

## Testing & Verification

### 1. Facebook Pixel Helper (Chrome Extension)
1. Install the [Facebook Pixel Helper](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Navigate to your website
3. Click the extension icon to verify:
   - Pixel is loading correctly
   - Events are firing
   - No errors present

### 2. Facebook Events Manager
1. Go to [Facebook Events Manager](https://business.facebook.com/events_manager)
2. Select your pixel (ID: 1409898642574301)
3. View real-time events in the "Test Events" tab
4. Check "Diagnostics" for any issues

### 3. Development Analytics Dashboard
In development mode, click the analytics icon (bottom-right) to see:
- Real-time event tracking
- Both GA4 and Facebook events
- Event parameters
- Platform indicators

## Best Practices

### 1. Privacy Compliance
- Ensure cookie consent is obtained before tracking
- Implement opt-out functionality if required
- Follow GDPR/CCPA guidelines

### 2. Data Quality
- Use consistent product IDs across platforms
- Include all required parameters for standard events
- Test events thoroughly before launching campaigns

### 3. Performance
- Pixel loads asynchronously to avoid blocking
- Events are batched when possible
- Minimal impact on page load times

## Next Steps

### 1. Server-Side Tracking (Conversion API)
For improved tracking accuracy and iOS 14.5+ compatibility:

1. Obtain a Facebook Access Token
2. Implement server-side purchase tracking
3. Send duplicate events from both client and server
4. Use event deduplication with event_id

### 2. Catalog Integration
1. Upload product catalog to Facebook
2. Enable dynamic ads
3. Set up product feed updates
4. Configure availability updates

### 3. Custom Audiences
1. Create website custom audiences
2. Set up abandoned cart retargeting
3. Build lookalike audiences
4. Implement dynamic retargeting

## Troubleshooting

### Common Issues

1. **Pixel not firing**
   - Check browser ad blockers
   - Verify environment variables are set
   - Check console for errors

2. **Missing parameters**
   - Ensure all required fields are included
   - Check data formatting (especially prices)
   - Verify product IDs match catalog

3. **Duplicate events**
   - Implement event_id for deduplication
   - Check for multiple pixel installations
   - Review routing logic

### Support Resources

- [Facebook Pixel Documentation](https://developers.facebook.com/docs/facebook-pixel)
- [Events Reference](https://developers.facebook.com/docs/facebook-pixel/reference)
- [Conversion API Guide](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Business Help Center](https://www.facebook.com/business/help)

## Enhanced Tracking Implementation

### FacebookTrackingService Usage

The new `FacebookTrackingService` provides a unified interface for all Facebook tracking:

```typescript
import { facebookTracking } from '@/lib/analytics/FacebookTrackingService';

// Track product interactions
facebookTracking.trackProductView(productId, productName, price, category);
facebookTracking.trackProductAddToCart(productId, productName, price, quantity);

// Track style quiz
facebookTracking.trackStyleQuizProgress('start');
facebookTracking.trackStyleQuizProgress('complete', { 
  styleType: 'Modern Professional',
  budget: '1000-plus' 
});

// Track special events
facebookTracking.trackSpecialEventInterest('wedding', { action: 'page_view' });
facebookTracking.trackSpecialEventInterest('prom', { school: 'Lincoln High' });

// Track appointments
facebookTracking.trackAppointment('styling');

// Track bundle interactions
facebookTracking.trackBundleInteraction(bundleName, bundlePrice, 'view');

// Track visual search
facebookTracking.trackVisualSearchUsed(resultsCount);

// Track high-value pages automatically
import { useFacebookPageTracking } from '@/hooks/useFacebookTracking';
// Use in component: useFacebookPageTracking();
```

### Automatic Page Tracking

High-value pages are automatically tracked when visited:
- `/wedding`, `/weddings` - Wedding collection (value: $75)
- `/custom-suits`, `/builder` - Custom tailoring (value: $150)
- `/bundles`, `/occasions` - Bundle deals (value: $80)
- `/style-quiz` - Style quiz (value: $50)
- `/prom` - Prom collection

### Facebook App Settings Configuration

Based on your app settings screenshots, ensure these are configured:

1. **API Version**: Set to v22.0 for all calls
2. **Social Discovery**: Enabled for app usage stories
3. **Age Restriction**: Set to Anyone (13+)
4. **Share Redirect**: Configure allowed domains if using custom share URLs
5. **Security Settings**: 
   - Keep app secret secure
   - Configure IP allowlist if needed
   - Enable 2-factor authentication for changes

## Security Best Practices

- **App Secret** (`6e1c702c56290016ffa5c8320017b363`): ONLY use server-side
- **Client Token** (`f296cad6d16fbf985116e940d41ea51d`): Safe for client-side SDK features
- **Access Tokens**: Generate and refresh server-side only
- **Dataset ID** (`283546658844002`): Use for Facebook Analytics integration
- Regular security audits of tracking implementation
- Monitor Facebook Events Manager for suspicious activity