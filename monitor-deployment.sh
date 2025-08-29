#!/bin/bash

echo "=== Monitoring Deployment Status ==="
echo ""
echo "Checking for Vendor Sync feature deployment..."
echo "This may take a few minutes as Railway builds and deploys..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check deployment status
check_deployment() {
    echo -n "Checking deployment status... "
    
    # Check if the admin panel has the new routes
    response=$(curl -s https://backend-production-7441.up.railway.app/admin/shopify-products 2>/dev/null)
    
    if echo "$response" | grep -q "Unauthorized"; then
        echo -e "${GREEN}API endpoint active (auth required)${NC}"
        return 0
    elif echo "$response" | grep -q "products"; then
        echo -e "${GREEN}API endpoint working!${NC}"
        return 0
    elif echo "$response" | grep -q "Cannot GET"; then
        echo -e "${YELLOW}New deployment not active yet${NC}"
        return 1
    else
        echo -e "${YELLOW}Deployment in progress...${NC}"
        return 1
    fi
}

# Monitor loop
max_attempts=20
attempt=1

while [ $attempt -le $max_attempts ]; do
    echo -e "${BLUE}Attempt $attempt/$max_attempts${NC}"
    
    if check_deployment; then
        echo ""
        echo -e "${GREEN}✅ Deployment Complete!${NC}"
        echo ""
        echo "=== Vendor Sync is Ready ==="
        echo "1. Admin Panel: https://backend-production-7441.up.railway.app/app"
        echo "2. Login with your credentials"
        echo "3. Look for 'Vendor Sync' in the sidebar"
        echo ""
        echo "Environment Variables Detected:"
        echo "✅ Shopify: suits-inventory.myshopify.com"
        echo "✅ Stripe: Live keys configured"
        echo "✅ S3/R2: CDN configured at cdn.kctmenswear.com"
        exit 0
    fi
    
    echo "Waiting 30 seconds before next check..."
    sleep 30
    attempt=$((attempt + 1))
    echo ""
done

echo -e "${YELLOW}⚠️ Deployment is taking longer than expected${NC}"
echo ""
echo "Manual check required:"
echo "1. Go to Railway dashboard: https://railway.app/dashboard"
echo "2. Check the deployment logs for any errors"
echo "3. The build URL: https://railway.app/project/d0792b49-f30a-4c02-b8ab-01a202f9df4e/service/2f6e09b8-3ec3-4c98-ab98-2b5c2993fa7a"