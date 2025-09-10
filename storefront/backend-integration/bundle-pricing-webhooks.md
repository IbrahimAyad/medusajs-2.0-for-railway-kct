# Bundle Pricing & Webhook Configuration

## Bundle Pricing Summary

### Tie Bundles
- **5-Tie Bundle**: $99.95 (Save $25)
- **8-Tie Bundle**: $149.95 (Save $50)
- **11-Tie Bundle**: $199.95 (Save $75)

### Suit Bundles
- **$199.99 Bundles**:
  - Essential Bundle (2-piece suit + shirt + tie)
  - Casual/Cocktail Bundles
  - Some Wedding Bundles
  
- **$229.99 Bundles**:
  - Professional Bundle (3-piece suit + shirt + tie)
  - Most Wedding Bundles
  - Standard bundles with premium colors

- **$249.99 Bundles**:
  - Executive Bundle (3-piece suit + 2 shirts + 2 ties)
  - All Prom Bundles (with tuxedos)
  - Premium Wedding Bundles

## Webhook Endpoints Needed

### From Frontend to Lovalbe Backend

```
POST https://your-backend.com/api/webhooks/order-created
POST https://your-backend.com/api/webhooks/payment-completed
POST https://your-backend.com/api/webhooks/customer-created
POST https://your-backend.com/api/webhooks/inventory-check
```

### Order Webhook Payload (Simplified)
```json
{
  "webhook_type": "order.created",
  "order_id": "KCT-2024-0001",
  "total": 229.99,
  "customer": {
    "email": "customer@email.com",
    "name": "John Doe",
    "phone": "313-555-0123",
    "address": {
      "street": "123 Main St",
      "city": "Detroit",
      "state": "MI",
      "zip": "48201"
    }
  },
  "items": [
    {
      "type": "bundle",
      "bundle_type": "professional",
      "price": 229.99,
      "components": [
        {
          "product": "Navy 3-Piece Suit",
          "size": "40R",
          "sku": "KCT-SUIT-NAVY-3P-40R"
        },
        {
          "product": "White Dress Shirt",
          "size": "M",
          "sku": "KCT-SHIRT-WHITE-SLIM-M"
        },
        {
          "product": "Burgundy Classic Tie",
          "sku": "KCT-TIE-BURGUNDY-CLASSIC"
        }
      ]
    }
  ]
}
```

## Quick Integration Checklist

- [ ] Set up webhook endpoints on Lovalbe backend
- [ ] Configure webhook URLs in frontend
- [ ] Test with sample order
- [ ] Verify customer data is captured
- [ ] Check inventory deduction works
- [ ] Confirm order appears in admin dashboard

## Bundle Detection Logic

```javascript
// How to detect bundle type from cart
function detectBundleType(items) {
  const hasSuit = items.some(i => i.category === 'suit');
  const hasShirt = items.some(i => i.category === 'shirt');
  const hasTie = items.some(i => i.category === 'tie');
  
  if (hasSuit && hasShirt && hasTie) {
    const total = items.reduce((sum, i) => sum + i.price, 0);
    
    if (total <= 199.99) return 'essential';
    if (total <= 229.99) return 'professional';
    if (total <= 249.99) return 'executive';
  }
  
  return null; // Not a bundle
}
```

## Contact for Integration Support

Ready to test the integration! The frontend is configured to send order data to your webhook endpoints once they're set up.