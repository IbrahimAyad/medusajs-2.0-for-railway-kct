# Google Analytics 4 Setup Guide

## 📊 Overview

This guide covers the complete setup and implementation of Google Analytics 4 (GA4) e-commerce tracking for KCT Menswear.

## 🚀 Quick Setup

### 1. Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Admin" (gear icon)
3. Click "Create Property"
4. Enter property name: "KCT Menswear"
5. Select timezone and currency (USD)
6. Choose "Retail" as industry category
7. Select business size
8. Choose objectives (Generate leads, Drive online sales, etc.)

### 2. Get Measurement ID

1. In GA4 property, go to Admin → Data Streams
2. Click "Add stream" → Web
3. Enter website URL: `https://kctmenswear.com`
4. Enter stream name: "KCT Menswear Website"
5. Copy the Measurement ID (G-XXXXXXXXXX)

### 3. Configure Environment Variable

Add to your `.env.local`:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Verify Installation

1. Open your website
2. Open GA4 Real-Time reports
3. You should see yourself as an active user
4. Navigate between pages to verify pageview tracking

## 📈 E-commerce Events Implemented

### Standard Events

| Event | Trigger | Data Collected |
|-------|---------|----------------|
| `page_view` | Every page navigation | URL, page title, referrer |
| `view_item_list` | Collection page load | Collection name, products shown |
| `view_item` | Product detail view | Product details, price |
| `select_item` | Product click in list | Product, list name |
| `add_to_cart` | Add to cart button | Product, quantity, price |
| `remove_from_cart` | Remove from cart | Product, quantity |
| `view_cart` | Cart page/drawer view | All cart items, total value |
| `begin_checkout` | Start checkout | Cart items, total |
| `add_shipping_info` | Shipping step | Shipping method |
| `add_payment_info` | Payment step | Payment method |
| `purchase` | Order complete | Transaction details, items |

### Custom Events

| Event | Trigger | Purpose |
|-------|---------|---------|
| `quick_view` | Quick view modal | Track engagement |
| `filter_collection` | Apply filters | Understand preferences |
| `add_to_wishlist` | Heart icon click | Track interest |
| `view_size_guide` | Size guide open | Reduce returns |
| `recommendation_click` | Click recommended item | Track AI effectiveness |
| `complete_style_quiz` | Finish style quiz | Personalization data |

## 🎯 Enhanced E-commerce Setup

### 1. Enable Enhanced E-commerce

1. Go to GA4 Admin → Data display → E-commerce
2. Toggle "Enable enhanced e-commerce reporting"

### 2. Configure Conversions

Mark these events as conversions:
- `purchase`
- `add_to_cart`
- `begin_checkout`
- `sign_up`
- `book_appointment`
- `newsletter_signup`

### 3. Create Audiences

Suggested audiences:
- **Cart Abandoners**: Started checkout but didn't purchase
- **High Intent**: Viewed 3+ products, added to cart
- **VIP Customers**: Purchased 2+ times
- **Wedding Shoppers**: Viewed wedding collection
- **Prom Shoppers**: Viewed prom collection

## 📋 Implementation Checklist

### Collection Pages
- [x] Track collection page views
- [x] Track product impressions
- [x] Track filter changes
- [x] Track product clicks
- [x] Track quick view opens
- [x] Track wishlist adds

### Product Pages
- [ ] Track product views
- [ ] Track image gallery interaction
- [ ] Track size selection
- [ ] Track add to cart
- [ ] Track social shares
- [ ] Track reviews interaction

### Cart & Checkout
- [ ] Track cart views
- [ ] Track cart updates
- [ ] Track checkout steps
- [ ] Track form field errors
- [ ] Track payment method selection
- [ ] Track order completion

### User Actions
- [ ] Track login/signup
- [ ] Track newsletter signups
- [ ] Track appointment bookings
- [ ] Track store locator usage
- [ ] Track contact form submissions

## 🔧 Testing & Debugging

### Use GA4 DebugView

1. Add to your code:
```javascript
// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  window.gtag('config', GA_MEASUREMENT_ID, {
    debug_mode: true
  });
}
```

2. Open GA4 → Admin → DebugView
3. Interact with your site
4. Watch events appear in real-time

### Browser Extensions

Install these for testing:
- Google Analytics Debugger
- GA4 Event Builder
- Tag Assistant Legacy

## 📊 Key Reports to Monitor

### Daily
1. **Real-time**: Active users, conversions
2. **Engagement**: Events, conversions, pages
3. **Monetization**: E-commerce purchases, revenue

### Weekly
1. **Acquisition**: Traffic sources, campaigns
2. **User**: Demographics, devices, locations
3. **Retention**: Cohort analysis, lifetime value

### Monthly
1. **Path Analysis**: User journeys
2. **Funnel Analysis**: Checkout completion
3. **Product Performance**: Best sellers, cart abandonment

## 🎨 Custom Dashboards

### E-commerce Dashboard
- Revenue by source
- Product performance
- Cart abandonment rate
- Average order value
- Conversion funnel

### Marketing Dashboard
- Campaign performance
- Cost per acquisition
- ROAS (Return on Ad Spend)
- Email/Social performance

## 🔗 Integrations

### Google Ads
1. Link GA4 to Google Ads
2. Import conversions
3. Create remarketing audiences
4. Track ad performance

### Google Search Console
1. Link to track organic performance
2. Monitor search queries
3. Track click-through rates

### Google Tag Manager (Optional)
For advanced tracking without code changes:
1. Install GTM container
2. Move GA4 tags to GTM
3. Create triggers for events
4. Test in preview mode

## 📱 Mobile App Tracking

If you have a mobile app:
1. Add Firebase SDK
2. Link Firebase to GA4
3. Track app + web in single property

## 🚨 Common Issues & Solutions

### Events Not Showing
- Check Measurement ID is correct
- Verify no ad blockers active
- Check browser console for errors
- Wait 24-48 hours for data

### Missing E-commerce Data
- Ensure currency is set correctly
- Verify product data structure
- Check for required fields (value, items)

### Duplicate Events
- Check for multiple GA4 installations
- Verify single initialization
- Review event triggers

## 📞 Support Resources

- [GA4 Documentation](https://support.google.com/analytics)
- [GA4 E-commerce Guide](https://support.google.com/analytics/answer/9268036)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Community Forum](https://support.google.com/analytics/community)

## 🎯 Next Steps

1. **Week 1**: Verify basic tracking
2. **Week 2**: Set up conversions and audiences
3. **Week 3**: Create custom reports
4. **Month 1**: Analyze data and optimize

---

Last Updated: January 2025
Status: Implementation Complete ✅