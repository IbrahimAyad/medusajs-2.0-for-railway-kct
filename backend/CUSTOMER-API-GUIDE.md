# Customer Management Enhanced API Guide

## ✅ Current Status
The enhanced customer features are **fully deployed and working** as backend APIs. The standard admin UI shows basic customer information, but all advanced features are accessible via API.

## 🚀 How to Use Enhanced Features

### 1. Testing with cURL or Postman

#### Get Customers with Analytics
```bash
curl https://backend-production-7441.up.railway.app/admin/customers-enhanced?include_stats=true
```

#### Get Customer Details with Full Analytics
```bash
curl https://backend-production-7441.up.railway.app/admin/customers-enhanced/cus_01K41FR0B2TK16445AC82G3R8A?include_analytics=true&include_orders=true
```

#### Search Customers
```bash
curl "https://backend-production-7441.up.railway.app/admin/customers-enhanced?q=gmail&limit=10"
```

#### Create Customer Group
```bash
curl -X POST https://backend-production-7441.up.railway.app/admin/customer-groups \
  -H "Content-Type: application/json" \
  -d '{"name": "VIP Customers", "metadata": {"discount": 20}}'
```

#### Bulk Operations
```bash
curl -X POST https://backend-production-7441.up.railway.app/admin/customers-enhanced/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "update",
    "customer_ids": ["cus_123", "cus_456"],
    "update_data": {"metadata": {"segment": "vip"}}
  }'
```

### 2. Frontend Integration

If you're building a custom frontend or extending the admin UI, you can use these endpoints:

```javascript
// Example: Fetch customers with analytics
async function getEnhancedCustomers() {
  const response = await fetch('/admin/customers-enhanced?include_stats=true')
  const data = await response.json()
  
  // Returns customers with stats like:
  // - customer_lifetime_value
  // - average_order_value
  // - total_orders
  // - risk_score
  // - segments
  return data.customers
}

// Example: Get customer with full details
async function getCustomerAnalytics(customerId) {
  const response = await fetch(
    `/admin/customers-enhanced/${customerId}?include_analytics=true`
  )
  const data = await response.json()
  
  // Returns enhanced customer with:
  // - Full analytics
  // - Order history
  // - Customer segments
  // - Risk assessment
  return data.customer
}
```

## 📊 Available Endpoints

### Enhanced Customer List
```
GET /admin/customers-enhanced
```

Query Parameters:
- `q` - Search query (searches email, name, phone, company)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset
- `order` - Sort field (created_at, email, etc.)
- `direction` - Sort direction (asc/desc)
- `has_account` - Filter by account status (true/false)
- `created_after` - Date filter
- `created_before` - Date filter
- `include_stats` - Include statistics (true/false)

### Enhanced Customer Detail
```
GET /admin/customers-enhanced/:id
```

Query Parameters:
- `include_orders` - Include order history
- `include_addresses` - Include addresses
- `include_groups` - Include customer groups
- `include_analytics` - Include full analytics

### Customer Groups
```
GET    /admin/customer-groups              - List all groups
POST   /admin/customer-groups              - Create group
GET    /admin/customer-groups/:id          - Get group details
POST   /admin/customer-groups/:id          - Update group
DELETE /admin/customer-groups/:id          - Delete group
POST   /admin/customer-groups/:id/customers/batch - Add/remove customers
```

### Bulk Operations
```
POST /admin/customers-enhanced/bulk
```

Body:
```json
{
  "operation": "delete|update|add_to_group",
  "customer_ids": ["cus_1", "cus_2"],
  "update_data": {},  // For update operation
  "group_id": "grp_1" // For group operations
}
```

### Customer Notes
```
POST /admin/customers-enhanced/:id/notes
```

Body:
```json
{
  "note": "Customer prefers morning deliveries",
  "type": "delivery_preference"
}
```

## 🎯 Use Cases

### 1. Identify VIP Customers
```bash
curl "https://backend-production-7441.up.railway.app/admin/customers-enhanced?include_stats=true" \
  | jq '.customers[] | select(.stats.customer_lifetime_value > 1000)'
```

### 2. Find At-Risk Customers
```bash
curl "https://backend-production-7441.up.railway.app/admin/customers-enhanced?include_stats=true" \
  | jq '.customers[] | select(.stats.risk_score == "high")'
```

### 3. Create Wedding Party Group
```bash
curl -X POST https://backend-production-7441.up.railway.app/admin/customer-groups \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smith Wedding Party",
    "metadata": {
      "event_date": "2025-06-15",
      "event_type": "wedding",
      "group_discount": 15
    }
  }'
```

## 🛠️ Integration with Third-Party Tools

### Zapier/Make.com Integration
Use the API endpoints to:
- Sync high-value customers to email marketing tools
- Alert sales team about at-risk customers
- Create automated workflows based on customer segments

### Custom Dashboard
Build a custom dashboard using:
- React/Vue/Angular frontend
- Fetch data from enhanced endpoints
- Display analytics and segments
- Implement bulk operations UI

## 📝 Notes

1. All endpoints require admin authentication (handled by Medusa automatically when accessed through admin panel)
2. The standard admin UI continues to work normally - enhanced features are additional
3. Data is real-time - no caching delays
4. All features are production-ready and tested

## 🆘 Support

If you need help implementing these features in your frontend or have questions about the API:
1. Check the response headers for rate limits
2. Use browser DevTools to inspect API calls
3. Test endpoints with Postman first
4. Ensure you're authenticated as admin

The enhanced customer management system is fully operational and ready for integration!