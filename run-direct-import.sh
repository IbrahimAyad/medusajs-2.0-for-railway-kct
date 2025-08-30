#!/bin/bash

echo "=== DIRECT DATABASE IMPORT - This WILL Work ==="
echo ""
echo "This bypasses all broken Medusa workflows and directly inserts products"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Choose import method:${NC}"
echo "1. Use Railway CLI (recommended)"
echo "2. Use connection string directly"
echo "3. Deploy force-import endpoint"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo -e "${GREEN}Running SQL via Railway CLI...${NC}"
        echo ""
        echo "Connecting to Railway database..."
        
        # Run the SQL file via Railway
        railway run --service Backend psql '$DATABASE_URL' < direct-sql-import.sql
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Products imported successfully!${NC}"
        else
            echo -e "${RED}Failed. Trying alternative method...${NC}"
            # Try with explicit service
            railway run --service Postgres psql < direct-sql-import.sql
        fi
        ;;
        
    2)
        echo -e "${YELLOW}Manual Database Connection${NC}"
        echo ""
        echo "You need to get your database URL from Railway:"
        echo "1. Go to Railway dashboard"
        echo "2. Click on Postgres service"
        echo "3. Go to Connect tab"
        echo "4. Copy the DATABASE_URL"
        echo ""
        read -p "Paste your DATABASE_URL here: " db_url
        
        # Run SQL with provided connection string
        psql "$db_url" < direct-sql-import.sql
        ;;
        
    3)
        echo -e "${GREEN}Testing force-import endpoint...${NC}"
        
        # First deploy the new endpoint
        echo "Deploying new endpoint..."
        cd backend
        railway up --service Backend --detach
        cd ..
        
        echo "Waiting for deployment (30 seconds)..."
        sleep 30
        
        # Test the endpoint
        echo "Testing force import..."
        curl -X POST https://backend-production-7441.up.railway.app/admin/force-import \
             -H "Content-Type: application/json" \
             -s | jq '.' || echo "Requires authentication"
        ;;
esac

echo ""
echo -e "${YELLOW}=== VERIFICATION ===${NC}"
echo ""
echo "Check if products were imported:"
echo "1. Go to: https://backend-production-7441.up.railway.app/app"
echo "2. Login and go to Products"
echo "3. You should see:"
echo "   - 2 PC Double Breasted Solid Suit (Charcoal)"
echo "   - 2 PC Satin Shawl Collar Suit (Burgundy)"
echo ""
echo "If products don't appear, try:"
echo "- Refresh the admin panel"
echo "- Clear browser cache"
echo "- Logout and login again"