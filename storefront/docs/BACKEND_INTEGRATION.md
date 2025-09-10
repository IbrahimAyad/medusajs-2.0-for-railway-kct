# KCT Menswear Backend Integration Documentation

## Overview

This document provides comprehensive documentation for all backend integrations, APIs, hooks, and services implemented in the KCT Menswear e-commerce platform.

## Table of Contents

1. [API Endpoints](#api-endpoints)
2. [React Hooks](#react-hooks)
3. [Analytics Events](#analytics-events)
4. [Email Templates](#email-templates)
5. [Webhook Payloads](#webhook-payloads)
6. [State Management](#state-management)
7. [Performance Optimization](#performance-optimization)

## API Endpoints

### Health Check
```
GET /api/health
```
Returns system health status for all services.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "services": {
    "api": { "status": "healthy", "responseTime": 45 },
    "email": { "status": "healthy" },
    "analytics": { "status": "healthy" },
    "webhooks": { "status": "healthy" },
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" },
    "recommendations": { "status": "healthy" }
  }
}
```

### Analytics Events
```
POST /api/analytics/events
```
Batch endpoint for analytics events.

**Request:**
```json
{
  "events": [
    {
      "name": "page_view",
      "properties": { "url": "/products/1" },
      "timestamp": 1234567890,
      "userId": "user123",
      "sessionId": "session123"
    }
  ]
}
```

### Recommendations
```
GET /api/recommendations?type=customers_also_bought&productId=1&limit=8
```

**Types:**
- `customers_also_bought`
- `complete_the_look`
- `based_on_style`
- `trending_in_size`
- `similar_products`
- `personalized`

### Product Affinity
```
GET /api/recommendations/affinity?productId=1
```

### Trending Products
```
GET /api/recommendations/trending?period=weekly
```

### Webhook Endpoints

#### Product Updates
```
POST /api/webhooks/admin/products
Headers: x-admin-signature: <signature>
```

#### Inventory Updates
```
POST /api/webhooks/admin/inventory
Headers: x-admin-signature: <signature>
```

#### Price Updates
```
POST /api/webhooks/admin/prices
Headers: x-admin-signature: <signature>
```

### Order Management
```
GET /api/orders/:orderId
POST /api/checkout/payment-intent
```

### Revalidation
```
POST /api/revalidate
Headers: x-revalidate-token: <token>
Body: { "paths": ["/products"], "tags": ["product-1"] }
```

## React Hooks

### Authentication & User Management

#### `useAuth()`
Manages user authentication state and operations.

```typescript
const { customer, isAuthenticated, isLoading, login, logout, updateProfile } = useAuth();

// Login
await login(email, password);

// Update profile
await updateProfile({ firstName: "John", lastName: "Doe" });
```

#### `useCustomerMeasurements()`
Manages customer body measurements.

```typescript
const { measurements, hasMeasurements, updateMeasurements } = useCustomerMeasurements();

await updateMeasurements({
  chest: 42,
  waist: 34,
  inseam: 32
});
```

#### `useStylePreferences()`
Manages style preferences.

```typescript
const { stylePreferences, updateStylePreferences } = useStylePreferences();

await updateStylePreferences({
  colors: ["navy", "black"],
  fit: "modern",
  occasions: ["business", "wedding"]
});
```

### Shopping Cart

#### `useCart()`
Complete cart management.

```typescript
const { 
  items, 
  cartSummary, 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart 
} = useCart();

// Add item with analytics tracking
addToCart(product, "42R", 1);

// Cart summary
console.log(cartSummary.itemCount, cartSummary.totalPrice);
```

### Product Management

#### `useProducts()`
Fetches all products with caching.

```typescript
const { products, featuredProducts, isLoading, error, refetch } = useProducts();
```

#### `useProduct(productId)`
Single product with real-time inventory.

```typescript
const { product, isLoading, error } = useProduct("product-1");
```

#### `useProductSearch()`
Product search functionality.

```typescript
const { products, searchQuery, isLoading, search } = useProductSearch();

search("navy suit");
```

### Analytics Tracking

#### `useAnalytics()`
Main analytics hook with auto-initialization.

```typescript
const analytics = useAnalytics();
```

#### `useTrackProductView(productId, category)`
Automatic product view tracking.

```typescript
useTrackProductView(product.id, product.category);
```

#### `useTrackCart()`
Cart event tracking.

```typescript
const { trackAddToCart, trackRemoveFromCart } = useTrackCart();

trackAddToCart({
  productId: "1",
  productName: "Navy Suit",
  category: "suits",
  price: 89900,
  quantity: 1,
  size: "42R",
  source: "product_page"
});
```

#### `useTrackCheckout()`
Checkout funnel tracking.

```typescript
const { trackCheckoutStep, trackPurchase } = useTrackCheckout();

trackCheckoutStep("started", { value: 89900, items: 1 });

trackPurchase({
  orderId: "ORD123",
  items: [...],
  value: 89900,
  tax: 7866,
  shipping: 0
});
```

### Recommendations

#### `useRecommendations(options)`
Base recommendation hook.

```typescript
const { recommendations, isLoading, error } = useRecommendations({
  type: "customers_also_bought",
  productId: "1",
  limit: 6,
  enabled: true
});
```

#### `useProductRecommendations(productId)`
Product page recommendations.

```typescript
const {
  customersAlsoBought,
  completeTheLook,
  similarProducts
} = useProductRecommendations(productId);
```

#### `usePersonalizedRecommendations()`
User-specific recommendations.

```typescript
const { recommendations } = usePersonalizedRecommendations();
```

### Notifications

#### `useNotifications()`
System notifications.

```typescript
const { 
  notifySuccess, 
  notifyError, 
  notifyWarning, 
  notifyInfo, 
  notifyInventory 
} = useNotifications();

notifySuccess("Order Placed", "Your order has been confirmed");
```

### Wedding Features

#### `useWedding()`
Wedding party management.

```typescript
const {
  wedding,
  currentMember,
  loadWedding,
  selectMember,
  updateMeasurements
} = useWedding();

await loadWedding("SMITH2024");
```

## Analytics Events

### Page View Events
```javascript
analytics.pageView({
  url: "/products/1",
  title: "Navy Blue Suit",
  productId: "1",
  category: "suits"
});
```

### E-commerce Events

#### Add to Cart
```javascript
analytics.addToCart({
  productId: "1",
  productName: "Navy Suit",
  category: "suits",
  price: 89900,
  quantity: 1,
  size: "42R",
  source: "product_page" // or "quick_add", "recommendations", "search"
});
```

#### Purchase
```javascript
analytics.purchase(orderId, items, value, tax, shipping);
```

### Search Events
```javascript
analytics.search({
  query: "navy suit",
  resultsCount: 15,
  filters: { category: "suits" }
});
```

### Style Quiz Events
```javascript
analytics.styleQuiz({
  step: "completed",
  results: {
    fit: "modern",
    colors: ["navy", "black"],
    occasions: ["business"],
    stylePersona: "modern"
  }
});
```

## Email Templates

### Order Confirmation
Template: `orderConfirmationTemplate(data)`

**Data Structure:**
```typescript
{
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: Address;
  estimatedDelivery: string;
}
```

### Shipping Update
Template: `shippingUpdateTemplate(data)`

**Data Structure:**
```typescript
{
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl: string;
  estimatedDelivery: string;
  items: Array<{ name: string; quantity: number; }>;
}
```

### Back in Stock Alert
Template: `backInStockTemplate(data)`

**Data Structure:**
```typescript
{
  customerName: string;
  productName: string;
  productImage: string;
  productPrice: number;
  size: string;
  productUrl: string;
  unsubscribeUrl: string;
}
```

### Wedding Invitation
Template: `weddingInvitationTemplate(data)`

**Data Structure:**
```typescript
{
  memberName: string;
  groomName: string;
  weddingDate: string;
  joinUrl: string;
  weddingCode: string;
}
```

## Webhook Payloads

### Product Webhook
```json
{
  "event": "product.created|updated|deleted|published",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "id": "1",
    "sku": "NVY-SUIT-001",
    "name": "Navy Suit",
    "price": 89900,
    "images": ["..."],
    "category": "suits",
    "variants": [
      { "size": "42R", "stock": 10, "price": 89900 }
    ]
  }
}
```

### Inventory Webhook
```json
{
  "event": "inventory.adjusted|reserved|released|sync",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "sku": "NVY-SUIT-001",
    "changes": [
      {
        "size": "42R",
        "previousStock": 10,
        "currentStock": 8,
        "reason": "Sale"
      }
    ]
  }
}
```

### Price Webhook
```json
{
  "event": "price.updated|sale_started|sale_ended",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "sku": "NVY-SUIT-001",
    "productId": "1",
    "changes": {
      "previousPrice": 99900,
      "currentPrice": 89900,
      "salePrice": 79900,
      "saleEndDate": "2024-12-31",
      "reason": "Holiday Sale"
    }
  }
}
```

## State Management

### Zustand Stores

#### Cart Store
```typescript
const cartStore = useCartStore();
// State: items, isLoading
// Actions: addItem, removeItem, updateQuantity, clearCart, syncCart
```

#### Auth Store
```typescript
const authStore = useAuthStore();
// State: customer, isAuthenticated, isLoading
// Actions: login, logout, updateProfile, refreshCustomer
```

#### Product Store
```typescript
const productStore = useProductStore();
// State: products, featuredProducts, isLoading, error
// Actions: fetchProducts, searchProducts, subscribeToInventory
```

#### Wedding Store
```typescript
const weddingStore = useWeddingStore();
// State: wedding, currentMember, isLoading
// Actions: loadWedding, updateMemberMeasurements, addMember
```

#### Notification Store
```typescript
const notificationStore = useNotificationStore();
// State: notifications
// Actions: addNotification, removeNotification, clearAll
```

## Performance Optimization

### Caching Strategy

1. **Product Data**: 60-second cache with Next.js revalidation
2. **Trending Data**: 1-hour cache in recommendation service
3. **User Data**: Persisted in localStorage with Zustand
4. **Analytics**: Batched events with 10-second flush interval

### Request Optimization

1. **Debouncing**: Search queries debounced by 300ms
2. **Batch Processing**: Analytics events sent in batches of 20
3. **Lazy Loading**: Recommendations loaded on-demand
4. **SSE/WebSocket**: Real-time inventory updates

### Error Handling

1. **Retry Logic**: Built into API clients with exponential backoff
2. **Fallback Data**: Mock data for development/errors
3. **Error Boundaries**: Implemented at component level
4. **Graceful Degradation**: Services continue with reduced functionality

## Development Tools

### Testing Dashboard
Access at `/dev/test` in development mode:
- Analytics event testing
- Recommendation algorithm testing
- Email template preview
- Webhook simulation
- Real-time inventory updates

### Health Check
Monitor system status at `/api/health`:
- Service availability
- Response times
- Error rates
- Performance metrics

## Environment Variables

Required environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://kct-menswear.vercel.app/api
NEXT_PUBLIC_API_KEY=your-api-key

# Email Service
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@kctmenswear.com

# Webhooks
WEBHOOK_SECRET=your-webhook-secret
ADMIN_WEBHOOK_SECRET=your-admin-secret
REVALIDATE_TOKEN=your-revalidate-token

# Analytics
NEXT_PUBLIC_GA_ID=your-ga-id

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
```

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Webhook Verification**: Validate signatures on all webhooks
3. **Input Validation**: Sanitize all user inputs
4. **Rate Limiting**: Implement on all public endpoints
5. **CORS**: Configure appropriate CORS policies
6. **Authentication**: JWT tokens with httpOnly cookies