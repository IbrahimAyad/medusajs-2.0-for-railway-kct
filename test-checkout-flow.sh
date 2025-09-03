#!/bin/bash

echo "==================================="
echo "Medusa Checkout Flow Testing"
echo "==================================="
echo ""

# Your session cookie from the browser
COOKIE="connect.sid=s%3ALyso2HtL-a4qycA62Bg_tVHblNA6Qsr9.%2FeLu5NAso4ZhLz%2FoS0juzmE7PzL0NSORpEi99JEejtw"
BASE_URL="https://backend-production-7441.up.railway.app"

echo "Step 1: Creating publishable API key..."
echo "-----------------------------------"
API_KEY_RESPONSE=$(curl -s -X POST $BASE_URL/admin/create-api-key \
  -H "Cookie: $COOKIE" \
  -H 'Content-Type: application/json')

API_KEY=$(echo "$API_KEY_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('api_key', ''))")

if [ -z "$API_KEY" ]; then
  echo "Failed to get API key. Response:"
  echo "$API_KEY_RESPONSE" | python3 -m json.tool
  echo ""
  echo "Using fallback test key..."
  API_KEY="pk_01JFSH5K7Y2E4H3M9XNV8ZQR6T"
fi

echo "API Key: $API_KEY"
echo ""

echo "Step 2: Creating a cart..."
echo "-----------------------------------"
CART_RESPONSE=$(curl -s -X POST $BASE_URL/store/cart-operations \
  -H "x-publishable-api-key: $API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "create",
    "customer_email": "test@example.com"
  }')

CART_ID=$(echo "$CART_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('cart_id', ''))")

if [ -z "$CART_ID" ]; then
  echo "Failed to create cart. Response:"
  echo "$CART_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "Cart created: $CART_ID"
echo ""

echo "Step 3: Getting a sample product variant..."
echo "-----------------------------------"
# Get products to find a variant ID
PRODUCTS_RESPONSE=$(curl -s "$BASE_URL/store/products?limit=1" \
  -H "x-publishable-api-key: $API_KEY")

VARIANT_ID=$(echo "$PRODUCTS_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
products = data.get('products', [])
if products and products[0].get('variants'):
    print(products[0]['variants'][0]['id'])
")

if [ -z "$VARIANT_ID" ]; then
  echo "No products found. Make sure products have been imported."
  echo "$PRODUCTS_RESPONSE" | python3 -m json.tool | head -20
  exit 1
fi

echo "Using variant: $VARIANT_ID"
echo ""

echo "Step 4: Adding item to cart..."
echo "-----------------------------------"
ADD_ITEM_RESPONSE=$(curl -s -X POST $BASE_URL/store/cart-operations \
  -H "x-publishable-api-key: $API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{
    \"action\": \"add_item\",
    \"cart_id\": \"$CART_ID\",
    \"variant_id\": \"$VARIANT_ID\",
    \"quantity\": 1
  }")

echo "$ADD_ITEM_RESPONSE" | python3 -m json.tool | head -30
echo ""

echo "Step 5: Adding shipping address..."
echo "-----------------------------------"
SHIPPING_RESPONSE=$(curl -s -X POST $BASE_URL/store/checkout \
  -H "x-publishable-api-key: $API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{
    \"action\": \"add_shipping_address\",
    \"cart_id\": \"$CART_ID\",
    \"first_name\": \"John\",
    \"last_name\": \"Doe\",
    \"address_1\": \"123 Main St\",
    \"city\": \"New York\",
    \"state\": \"NY\",
    \"postal_code\": \"10001\",
    \"email\": \"test@example.com\",
    \"phone\": \"555-0100\"
  }")

echo "$SHIPPING_RESPONSE" | python3 -m json.tool | head -20
echo ""

echo "Step 6: Initializing payment..."
echo "-----------------------------------"
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/store/checkout \
  -H "x-publishable-api-key: $API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{
    \"action\": \"initialize_payment\",
    \"cart_id\": \"$CART_ID\"
  }")

CLIENT_SECRET=$(echo "$PAYMENT_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('client_secret', ''))")

if [ -n "$CLIENT_SECRET" ]; then
  echo "✅ Payment initialized successfully!"
  echo "Client Secret: $CLIENT_SECRET"
  echo ""
  echo "Use this client secret with Stripe.js to complete payment on the frontend."
else
  echo "Payment initialization response:"
  echo "$PAYMENT_RESPONSE" | python3 -m json.tool
fi

echo ""
echo "==================================="
echo "Checkout Flow Test Complete!"
echo "==================================="
echo ""
echo "Summary:"
echo "- API Key: $API_KEY"
echo "- Cart ID: $CART_ID"
echo "- Variant ID: $VARIANT_ID"
echo "- Client Secret: $CLIENT_SECRET"
echo ""
echo "Save the API key in your frontend .env:"
echo "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$API_KEY"
echo "==================================="