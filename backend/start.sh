#!/bin/bash

# Debug: Show environment variables are available at runtime
echo "=== RAILWAY PRODUCTION ENVIRONMENT CHECK ==="
echo "NODE_ENV: $NODE_ENV"
echo "Railway Domain: $RAILWAY_PUBLIC_DOMAIN_VALUE"
echo ""
echo "=== STRIPE CONFIGURATION ==="
echo "STRIPE_API_KEY available: ${STRIPE_API_KEY:+Yes}"
echo "STRIPE_WEBHOOK_SECRET available: ${STRIPE_WEBHOOK_SECRET:+Yes}"
echo ""
echo "=== S3/R2 CONFIGURATION ==="
echo "S3_ACCESS_KEY_ID available: ${S3_ACCESS_KEY_ID:+Yes}"
echo "S3_SECRET_ACCESS_KEY available: ${S3_SECRET_ACCESS_KEY:+Yes}"
echo "S3_BUCKET: $S3_BUCKET"
echo "S3_ENDPOINT: $S3_ENDPOINT"
echo "S3_FILE_URL: $S3_FILE_URL"
echo ""
echo "=== STARTING MEDUSA BACKEND ==="

# Start the backend
pnpm start