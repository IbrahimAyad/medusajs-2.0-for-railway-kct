#!/bin/bash

# Exit on any error
set -e

echo "=== STARTING RAILWAY BACKEND DEPLOYMENT ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: ${PORT:-NOT SET}"
echo "DATABASE_URL: ${DATABASE_URL:+[SET]}"
echo "REDIS_URL: ${REDIS_URL:+[SET]}"

# Run init-backend script first
if [ -f "src/scripts/init-backend.js" ]; then
    echo "Running init-backend script..."
    node src/scripts/init-backend.js || echo "WARNING: init-backend.js had issues"
fi

# Copy api directory if it exists (backup in case postBuild didn't run)
if [ -d "../src/api" ] && [ ! -d ".medusa/server/src/api" ]; then
    echo "Copying src/api to .medusa/server/src/api..."
    mkdir -p .medusa/server/src
    cp -r ../src/api .medusa/server/src/api
fi

# Change to .medusa/server directory
cd .medusa/server

# Check BOTH locations for subscribers
echo "=== Checking for subscribers ==="

# Check original src/subscribers directory (where Medusa looks)
if [ -d "../../src/subscribers" ]; then
    echo "Checking original src/subscribers directory:"
    ls -la ../../src/subscribers/ | grep "\.js$" || true

    if [ -f "../../src/subscribers/auth-identity-created.js" ]; then
        echo "✅ Found compiled subscriber in original location (../../src/subscribers/)"
    fi
fi

# Also check .medusa/server/src/subscribers
if [ -d "src/subscribers" ]; then
    echo "Checking .medusa/server/src/subscribers directory:"
    ls -la src/subscribers/ | grep "\.js$" || true

    # Check if auth-identity-created.js has correct format
    if [ -f "src/subscribers/auth-identity-created.js" ]; then
        echo "Checking auth-identity-created.js format:"
        grep -E "exports\.(default|config)" src/subscribers/auth-identity-created.js | head -5 || true
        echo "✅ Subscribers are ready in .medusa/server"
    fi
else
    echo "WARNING: No subscribers directory in .medusa/server!"
    echo "Checking if we can recover..."

    # Emergency fallback - try to compile if missing
    if [ -f "../../src/scripts/compileSubscribers.js" ]; then
        echo "Attempting emergency subscriber compilation..."
        cd ../..
        node src/scripts/compileSubscribers.js
        cd .medusa/server

        if [ -d "src/subscribers" ]; then
            echo "Emergency compilation successful"
            ls -la src/subscribers/
        fi
    fi
fi

# Start Medusa - it will use the PORT environment variable automatically
echo "Starting Medusa on port ${PORT:-8080}..."
exec npx medusa start