# Vendor Sync Guide - KCT Menswear

## Overview
The Vendor Sync feature integrates with your Shopify vendor store (suits-inventory.myshopify.com) to import products into your Medusa admin panel.

## Accessing Vendor Sync

1. **Login to Admin Panel**
   - URL: https://backend-production-7441.up.railway.app/app
   - Use your admin credentials

2. **Navigate to Vendor Sync**
   - Look for "Vendor Sync" tab in the sidebar
   - Icon: Shopping Bag

## Using Vendor Sync

### Viewing Products
The interface displays products from your Shopify vendor with:
- Product image and title
- SKU
- Current inventory levels
- Price
- Sync status (Synced/Pending)

### Selecting Products to Import
1. Use checkboxes to select individual products
2. Use the header checkbox to select all products
3. Selected count appears at the bottom

### Syncing Products
1. **Manual Sync**: Click "Sync Now" button
   - Syncs only selected products (if any selected)
   - Syncs all products (if none selected)
   
2. **Automatic Sync**: Runs automatically
   - Schedule: Wednesdays and Saturdays at 2 AM
   - Syncs all products from Shopify

### Product Data Synced
- Product title and description
- All variants (sizes, colors)
- Inventory quantities
- Pricing
- Product images
- SKUs
- Vendor information

## Sync Status Indicators

- **Green "Synced" badge**: Product successfully imported
- **Yellow "Pending" badge**: Product needs sync
- **Last sync timestamp**: Shows when sync last ran

## Troubleshooting

### Products Not Appearing
1. Check Shopify API credentials in Railway environment
2. Verify products exist in suits-inventory.myshopify.com
3. Check Railway logs for sync errors

### Sync Failed
1. Verify internet connection
2. Check Shopify API rate limits
3. Ensure Railway service is running

### Inventory Not Updating
- Manual sync required for immediate updates
- Automatic sync runs twice weekly
- Check Shopify location ID is correct

## Best Practices

1. **Regular Syncs**: Run manual sync before major sales events
2. **Selective Import**: Only import products you plan to sell
3. **Inventory Monitoring**: Check sync status after vendor updates
4. **Bulk Operations**: Select multiple products for efficient syncing

## Environment Variables (Railway)

Required variables for Shopify integration:
```
SHOPIFY_DOMAIN=suits-inventory.myshopify.com
SHOPIFY_ACCESS_TOKEN=[your_token]
SHOPIFY_LOCATION_ID=[your_location_id]
```

## Support

For issues with Vendor Sync:
1. Check Railway deployment logs
2. Verify Shopify API credentials
3. Ensure products exist in vendor store
4. Contact support if sync consistently fails