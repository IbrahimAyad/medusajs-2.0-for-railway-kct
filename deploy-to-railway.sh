#!/bin/bash

# Deploy Stripe Tax Update to Railway
echo "========================================="
echo "Deploying Stripe Tax Update to Railway"
echo "========================================="

# Navigate to backend directory
cd backend

# Try to deploy with different service names
echo "Attempting to deploy to Railway..."

# Try common service names
for SERVICE in "backend" "medusa" "backend-production-7441" "medusa-backend" "production"; do
    echo "Trying service: $SERVICE"
    railway up --service "$SERVICE" 2>/dev/null && {
        echo "✅ Successfully deployed using service: $SERVICE"
        exit 0
    }
done

# If all fail, try without service flag (will prompt)
echo "Trying without service flag (may prompt for selection)..."
railway up && {
    echo "✅ Successfully deployed!"
    exit 0
}

echo "❌ Could not deploy automatically. Please run:"
echo "   cd backend && railway up"
echo "   Then select your service from the list"
