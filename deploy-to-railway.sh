#!/bin/bash

echo "=== Deploying Medusa Backend to Railway ==="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "Error: backend directory not found"
    echo "Make sure you're in the medusa-railway-setup directory"
    exit 1
fi

echo "1. Checking git status..."
git status --short

echo ""
echo "2. Adding all changes..."
git add -A

echo ""
echo "3. Creating commit..."
git commit -m "Deploy Shopify sync fixes and updates" || echo "No changes to commit"

echo ""
echo "4. Deploying to Railway..."
echo "   Note: If this fails, manually deploy from Railway dashboard"
echo ""

# Try to deploy
railway up --detach || {
    echo ""
    echo "=== Manual Deployment Instructions ==="
    echo "1. Go to https://railway.app/dashboard"
    echo "2. Select the 'admin-kct' project"
    echo "3. Click on the backend service"
    echo "4. Click 'Deploy' or 'Redeploy'"
    echo ""
    echo "Or use GitHub:"
    echo "1. Push to your GitHub repo"
    echo "2. Railway will auto-deploy from GitHub"
}

echo ""
echo "=== Deployment Complete ==="
echo "Admin Panel: https://backend-production-7441.up.railway.app/app"
echo "Vendor Sync: Available in admin sidebar"