# Manual Product Creation Guide

Since the CSV import has transaction issues, here are your options:

## Option 1: Manual Entry in Admin Panel

1. **Login to Admin Panel**
   - Go to: https://backend-production-7441.up.railway.app/app
   - Login with your credentials

2. **Create Products Manually**
   - Click "Products" → "Create Product"
   - Enter the following for each product:

### Product 1: Pin-Stripe Suit
- **Title**: 2 PC Double Breasted Pin-Stripe Suit
- **Handle**: mens-suit-m396sk-02
- **Description**: Elegant double-breasted men's suit featuring classic pin-stripe pattern
- **Status**: Published
- **Thumbnail**: https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M396SK-02.jpg
- **Add Variants**:
  - 36S - SKU: M396SK-02-36S - Price: $174.99
  - 38R - SKU: M396SK-02-38R - Price: $174.99
  - 40R - SKU: M396SK-02-40R - Price: $174.99
  - 42R - SKU: M396SK-02-42R - Price: $174.99
  - 44R - SKU: M396SK-02-44R - Price: $174.99

### Product 2: Charcoal Suit (HIGH STOCK)
- **Title**: 2 PC Double Breasted Solid Suit
- **Handle**: mens-suit-m404sk-03
- **Description**: Versatile charcoal gray double-breasted suit
- **Status**: Published
- **Thumbnail**: https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg
- **Add Variants**:
  - 36S - SKU: M404SK-03-36S - Price: $250.00
  - 38R - SKU: M404SK-03-38R - Price: $250.00
  - 40R - SKU: M404SK-03-40R - Price: $250.00
  - 42R - SKU: M404SK-03-42R - Price: $250.00
  - 44R - SKU: M404SK-03-44R - Price: $250.00

### Product 3: Burgundy Tuxedo
- **Title**: 2 PC Satin Shawl Collar Suit
- **Handle**: mens-suit-m341sk-06
- **Description**: Rich burgundy suit with satin shawl collar
- **Status**: Published
- **Thumbnail**: https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg
- **Add Variants**:
  - 36S - SKU: M341SK-06-36S - Price: $174.99
  - 38R - SKU: M341SK-06-38R - Price: $174.99
  - 40R - SKU: M341SK-06-40R - Price: $174.99
  - 42R - SKU: M341SK-06-42R - Price: $174.99
  - 44R - SKU: M341SK-06-44R - Price: $174.99

## Option 2: Get Admin Token and Use API

1. **Get your admin token**:
   - Login to admin panel
   - Open browser developer tools (F12)
   - Go to Network tab
   - Make any action (like clicking Products)
   - Look for request headers
   - Find "Authorization: Bearer ..." header
   - Copy the token after "Bearer "

2. **Use the token to import**:
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST https://backend-production-7441.up.railway.app/admin/import-shopify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shopify_ids": [
      "9736048476473",
      "9776181510457", 
      "9736048738617"
    ],
    "import_all": false
  }'
```

## Option 3: Direct Shopify Import (If Configured)

If the Shopify integration is working, the products might auto-sync. Check:
1. Go to Products in admin panel
2. Look for any products with Shopify metadata
3. If none, the sync might need to be triggered

## Option 4: Use Postman or Insomnia

1. Download Postman or Insomnia
2. Create a new POST request
3. URL: `https://backend-production-7441.up.railway.app/admin/import-shopify`
4. Headers:
   - Content-Type: application/json
   - Authorization: Bearer [YOUR_TOKEN]
5. Body (JSON):
```json
{
  "shopify_ids": ["9776181510457"],
  "import_all": false
}
```

## Quick Test

To test if products can be created at all:
1. Try creating ONE simple product manually in admin
2. If that works, the system is fine - just CSV import is broken
3. Continue with manual creation or API

## Summary

The CSV import workflow has transaction issues in Medusa 2.0. Your best options are:
1. **Manual creation** in admin panel (most reliable)
2. **API import** with authentication token
3. Wait for Medusa to fix the CSV import bug

Start with creating just ONE product manually to verify everything works!