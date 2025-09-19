#!/bin/bash

# Update CORS environment variables for Railway backend

echo "Updating CORS configuration for Railway backend..."

# The correct CORS values that include all domains
STORE_CORS="http://localhost:3000,https://kct-menswear-medusa-test.vercel.app,https://storefront-production-c1c6.up.railway.app"
AUTH_CORS="http://localhost:7000,http://localhost:7001,https://kct-menswear-medusa-test.vercel.app,https://storefront-production-c1c6.up.railway.app"
ADMIN_CORS="http://localhost:7000,http://localhost:7001,https://kct-menswear-medusa-test.vercel.app,https://storefront-production-c1c6.up.railway.app"

echo "Setting STORE_CORS..."
railway variables set STORE_CORS="$STORE_CORS" --service Backend

echo "Setting AUTH_CORS..."
railway variables set AUTH_CORS="$AUTH_CORS" --service Backend

echo "Setting ADMIN_CORS..."
railway variables set ADMIN_CORS="$ADMIN_CORS" --service Backend

echo "CORS configuration updated. Redeploying..."
railway up --service Backend

echo "Done!"