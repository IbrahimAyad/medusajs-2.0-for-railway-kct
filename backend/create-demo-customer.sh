#!/bin/bash

echo "🎯 Creating KCT VIP Demo Customer"
echo "=================================="
echo ""

# Run the TypeScript script to create demo customer
npx tsx src/scripts/create-demo-customer.ts

echo ""
echo "=================================="
echo "✅ Demo Customer Created!"
echo "=================================="
echo ""
echo "📧 Email: john.smith.vip@kctmenswear.com"
echo ""
echo "This demo customer includes:"
echo "• Full contact information"
echo "• Customer analytics (CLV, AOV, Risk Score)"
echo "• Customer segments (VIP, Frequent Buyer, Wedding Party)"
echo "• Wedding event details"
echo "• Purchase history"
echo "• Loyalty program status"
echo "• Multiple addresses"
echo "• Internal notes"
echo "• Custom KCT fields"
echo ""
echo "You can now:"
echo "1. View this customer in the admin panel"
echo "2. Access enhanced data via API:"
echo "   GET /admin/customers-enhanced/{customer_id}?include_analytics=true"
echo ""
echo "The standard admin UI will show basic info,"
echo "while the API returns all enhanced features!"