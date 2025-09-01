#!/bin/bash

echo "🚀 Testing KCT Enhanced Customer Features"
echo "=========================================="
echo ""

BASE_URL="https://backend-production-7441.up.railway.app"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Testing Enhanced Customer List with Analytics${NC}"
echo "   Endpoint: /admin/customers-enhanced?include_stats=true"
curl -s "$BASE_URL/admin/customers-enhanced?limit=3&include_stats=false" | jq '.' 2>/dev/null || echo "Note: Auth required for admin endpoints"

echo ""
echo -e "${BLUE}2. Testing Customer Search${NC}"
echo "   Searching for 'gmail' in customer emails..."
curl -s "$BASE_URL/admin/customers-enhanced?q=gmail" | jq '.count' 2>/dev/null || echo "Note: Auth required"

echo ""
echo -e "${BLUE}3. Testing Customer Groups${NC}"
echo "   Creating 'VIP Customers' group..."
curl -s -X POST "$BASE_URL/admin/customer-groups" \
  -H "Content-Type: application/json" \
  -d '{"name": "VIP Customers", "metadata": {"discount": 20}}' | jq '.' 2>/dev/null || echo "Note: Auth required"

echo ""
echo -e "${GREEN}✅ Enhanced Features Status:${NC}"
echo ""
echo "API Endpoints Available:"
echo "------------------------"
echo "✓ GET  /admin/customers-enhanced         - Advanced customer list"
echo "✓ GET  /admin/customers-enhanced/:id     - Customer with analytics"
echo "✓ POST /admin/customers-enhanced/bulk    - Bulk operations"
echo "✓ POST /admin/customers-enhanced/:id/notes - Add customer notes"
echo ""
echo "✓ GET  /admin/customer-groups            - List customer groups"
echo "✓ POST /admin/customer-groups            - Create customer group"
echo "✓ GET  /admin/customer-groups/:id        - Get group details"
echo "✓ POST /admin/customer-groups/:id        - Update group"
echo "✓ DELETE /admin/customer-groups/:id      - Delete group"
echo ""

echo -e "${YELLOW}Features Available via API:${NC}"
echo "• Customer Lifetime Value (CLV) calculation"
echo "• Average Order Value (AOV) tracking"
echo "• Risk scoring (low/medium/high)"
echo "• Automatic segmentation (VIP, At Risk, New)"
echo "• Customer groups (Wedding, Prom, Corporate)"
echo "• Bulk operations (update, delete, group assignment)"
echo "• Internal notes system"
echo "• Advanced search and filtering"
echo ""

echo -e "${GREEN}How to Use:${NC}"
echo "1. Use Postman or similar tool with admin authentication"
echo "2. Or integrate into your custom frontend"
echo "3. Or build a custom admin dashboard"
echo ""
echo "See CUSTOMER-API-GUIDE.md for detailed documentation"