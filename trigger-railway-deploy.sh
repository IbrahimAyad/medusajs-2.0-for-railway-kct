#!/bin/bash

echo "=== Railway Deployment Trigger ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Railway Auto-Deployment Configuration:${NC}"
echo "• Repository: IbrahimAyad/medusajs-2.0-for-railway-kct"
echo "• Branch: master"
echo "• Services: backend, storefront"
echo ""

echo -e "${GREEN}Current Deployment Status:${NC}"
echo -n "Backend Health: "
if curl -s https://backend-production-7441.up.railway.app/health | grep -q "OK"; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

echo -n "Admin Panel: "
if curl -s -I https://backend-production-7441.up.railway.app/app | grep -q "200"; then
    echo -e "${GREEN}✓ Accessible${NC}"
else
    echo -e "${RED}✗ Not accessible${NC}"
fi
echo ""

echo -e "${YELLOW}To trigger a new deployment:${NC}"
echo ""
echo "Option 1: Automatic (via GitHub push)"
echo "  The deployment will trigger automatically when changes"
echo "  are pushed to: https://github.com/IbrahimAyad/medusajs-2.0-for-railway-kct"
echo ""
echo "Option 2: Manual (via Railway Dashboard)"
echo "  1. Go to: https://railway.app/project/d0792b49-f30a-4c02-b8ab-01a202f9df4e"
echo "  2. Click on 'backend' service"
echo "  3. Click 'Deploy' → 'Redeploy' button"
echo ""
echo "Option 3: Force Redeploy (via Railway Dashboard)"
echo "  1. Go to the service page"
echo "  2. Click 'Settings' tab"
echo "  3. Click 'Restart' to force a fresh deployment"
echo ""

echo -e "${GREEN}Recent Git Activity:${NC}"
git log --oneline -3
echo ""

echo -e "${YELLOW}Environment Variables Status:${NC}"
echo "Check that these are set in Railway:"
echo "  • DATABASE_URL"
echo "  • REDIS_URL"
echo "  • JWT_SECRET"
echo "  • COOKIE_SECRET"
echo "  • SHOPIFY_DOMAIN"
echo "  • SHOPIFY_ACCESS_TOKEN (keep secret!)"
echo "  • STRIPE_API_KEY (keep secret!)"
echo ""

echo "Dashboard: https://railway.app/project/d0792b49-f30a-4c02-b8ab-01a202f9df4e"