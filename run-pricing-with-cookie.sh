#!/bin/bash

echo "=================================="
echo "KCT Menswear - Pricing Setup (Cookie Method)"
echo "=================================="
echo ""

# Your session cookie from the browser
COOKIE="connect.sid=s%3ALyso2HtL-a4qycA62Bg_tVHblNA6Qsr9.%2FeLu5NAso4ZhLz%2FoS0juzmE7PzL0NSORpEi99JEejtw"

echo "Using your session cookie to apply pricing..."
echo ""

# Run the pricing setup using cookie
RESPONSE=$(curl -s -X POST https://backend-production-7441.up.railway.app/admin/setup-product-pricing \
  -H "Cookie: $COOKIE" \
  -H 'Content-Type: application/json')

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Pricing has been applied to all 201 products."
    echo ""
    echo "Results:"
    echo "$RESPONSE" | python3 -m json.tool
else
    echo "Response received:"
    echo "$RESPONSE" | python3 -m json.tool
    echo ""
    echo "If you see 'Unauthorized', the cookie may have expired."
    echo "Please refresh the admin page and get a new cookie."
fi

echo ""
echo "=================================="
echo "Checking pricing status..."
curl -s https://backend-production-7441.up.railway.app/pricing-status | python3 -m json.tool

echo ""
echo "=================================="
echo "DONE!"
echo "==================================">