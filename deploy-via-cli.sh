#!/bin/bash

echo "=== Railway CLI Deployment ==="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment to Railway...${NC}"
echo ""

# Check if we're in the backend directory
if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    echo "Navigating to backend directory..."
    cd backend 2>/dev/null || { echo "Error: backend directory not found"; exit 1; }
fi

echo -e "${BLUE}Project: admin-kct${NC}"
echo -e "${BLUE}Environment: production${NC}"
echo -e "${BLUE}Service: Backend${NC}"
echo ""

# Deploy using Railway CLI
echo -e "${YELLOW}Deploying...${NC}"
railway up --service Backend --detach

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment initiated successfully!${NC}"
    echo ""
    echo "Monitor deployment at:"
    echo "https://railway.app/project/d0792b49-f30a-4c02-b8ab-01a202f9df4e"
    echo ""
    echo "To check logs:"
    echo "  railway logs --service Backend"
else
    echo ""
    echo -e "${YELLOW}If deployment fails, try:${NC}"
    echo "1. Ensure you're logged in: railway login"
    echo "2. Link project: railway link --project d0792b49-f30a-4c02-b8ab-01a202f9df4e"
    echo "3. Deploy manually from Railway dashboard"
fi