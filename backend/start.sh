#!/bin/bash

# Run init-backend script first
node src/scripts/init-backend.js

# Debug: Show environment variables are available at runtime
echo "=== RAILWAY PRODUCTION ENVIRONMENT CHECK ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
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

# Copy necessary files to .medusa/server (these should already be there from build)
if [ -f medusa-config.js ] && [ -d .medusa/server ]; then
  echo "Copying configuration files..."
  cp medusa-config.js .medusa/server/medusa-config.js 2>/dev/null

  if [ -d src/lib ]; then
    mkdir -p .medusa/server/src
    cp -r src/lib .medusa/server/src/lib 2>/dev/null
  fi

  if [ -d src/subscribers ]; then
    mkdir -p .medusa/server/src
    cp -r src/subscribers .medusa/server/src/subscribers 2>/dev/null
  fi
fi

echo "=== STARTING MEDUSA BACKEND ==="

# Export PORT for Medusa to use
export PORT=${PORT:-9000}
echo "Starting Medusa on PORT: $PORT"

# Start Medusa directly from the built directory
cd .medusa/server && npx medusa start