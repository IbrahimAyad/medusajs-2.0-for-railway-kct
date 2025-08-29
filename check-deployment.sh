#!/bin/bash

echo "Checking KCT Medusa deployment status..."
echo "========================================="

# Check backend health
echo -n "Backend Health: "
curl -s https://backend-production-7441.up.railway.app/health || echo "FAILED"

echo ""
echo -n "Admin Panel: "
if curl -s -I https://backend-production-7441.up.railway.app/app | grep -q "200"; then
    echo "✓ Accessible"
    echo "URL: https://backend-production-7441.up.railway.app/app"
else
    echo "✗ Not accessible"
fi

echo ""
echo "Railway Service Status:"
railway status

echo ""
echo "Recent logs (last 20 lines):"
railway logs --service Backend 2>&1 | tail -20 || echo "Could not fetch logs"

echo ""
echo "========================================="
echo "Admin Credentials:"
echo "Email: admin@kctmenswear.com"
echo "Password: 127598"
echo "========================================="