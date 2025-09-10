# Google Analytics 4 Setup Guide

This guide will help you set up Google Analytics 4 (GA4) for the KCT Menswear website.

## Prerequisites

1. A Google account
2. Access to Google Analytics
3. Admin access to the website's environment variables

## Step 1: Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Click on "Admin" (gear icon) in the bottom left
3. Click "Create Property"
4. Enter property details:
   - Property name: "KCT Menswear"
   - Time zone: Your business timezone
   - Currency: USD
5. Click "Next"
6. Fill in business details:
   - Industry category: "Shopping"
   - Business size: Select appropriate size
7. Select your business objectives
8. Click "Create"

## Step 2: Set up a Web Data Stream

1. Select "Web" as the platform
2. Enter your website URL: `https://kctmenswear.com`
3. Stream name: "KCT Menswear Website"
4. Click "Create stream"
5. Copy the "Measurement ID" (starts with G-)

## Step 3: Configure Environment Variable

Add the Measurement ID to your environment variables:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For Vercel deployment:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` with your Measurement ID

## Step 4: Verify Installation

1. Deploy your changes
2. Visit your website
3. In Google Analytics, go to "Reports" → "Realtime"
4. You should see your visit appear

## Step 5: Configure Enhanced E-commerce

1. In GA4, go to "Admin" → "Data Streams" → Select your stream
2. Click "Configure tag settings"
3. Under "Settings", click "Show all"
4. Enable:
   - Enhanced measurement
   - E-commerce events

## Tracked Events

The following events are automatically tracked:

### E-commerce Events
- `view_item` - When a product is viewed
- `add_to_cart` - When item is added to cart
- `remove_from_cart` - When item is removed from cart
- `begin_checkout` - When checkout process starts
- `purchase` - When order is completed

### User Events
- `login` - When user signs in
- `sign_up` - When user creates account
- `search` - When user searches for products

### Page Views
- Automatically tracked on every page navigation

## Setting up Conversion Tracking

1. In GA4, go to "Admin" → "Events"
2. Find the "purchase" event
3. Toggle "Mark as conversion"
4. Repeat for other important events (e.g., "add_to_cart", "sign_up")

## Creating Custom Reports

### E-commerce Performance Report
1. Go to "Reports" → "Life cycle" → "Monetization"
2. View:
   - E-commerce purchases
   - Purchase journey
   - Product performance

### User Acquisition Report
1. Go to "Reports" → "Life cycle" → "Acquisition"
2. View:
   - User acquisition by channel
   - New vs returning users

## Best Practices

1. **Privacy Compliance**
   - Add GA4 to your privacy policy
   - Implement cookie consent if required
   - Consider using Google Consent Mode

2. **Data Retention**
   - Set appropriate data retention period
   - Default is 14 months

3. **User ID Tracking**
   - Consider implementing User ID for logged-in users
   - Enables cross-device tracking

4. **Custom Dimensions**
   - Add custom dimensions for:
     - Customer type (new/returning)
     - Product categories
     - User preferences

## Debugging

### Enable Debug Mode
In development, you can enable debug mode:

```javascript
import { enableDebugMode } from '@/lib/analytics/google-analytics'
enableDebugMode()
```

### Use GA4 DebugView
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable the extension
3. In GA4, go to "Admin" → "DebugView"
4. You'll see real-time event data

## Troubleshooting

### Events not appearing?
1. Check if Measurement ID is correctly set
2. Verify no ad blockers are active
3. Check browser console for errors
4. Ensure GA script is loading

### Purchase tracking issues?
1. Verify checkout success page is loading
2. Check if transaction data is being passed
3. Ensure currency is set correctly

## Additional Resources

- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [E-commerce Setup Guide](https://support.google.com/analytics/answer/9268036)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)