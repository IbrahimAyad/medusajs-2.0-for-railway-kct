#!/bin/bash

# Exit on any error
set -e

echo "=== STARTING RAILWAY BACKEND DEPLOYMENT ==="
echo "Current directory: $(pwd)"
echo "Contents of current directory:"
ls -la

# Check if we're in the right directory
if [ ! -f "medusa-config.js" ]; then
    echo "ERROR: medusa-config.js not found in current directory!"
    exit 1
fi

# Run init-backend script first
echo "=== Running init-backend script ==="
if [ -f "src/scripts/init-backend.js" ]; then
    node src/scripts/init-backend.js || {
        echo "ERROR: init-backend.js failed!"
        exit 1
    }
else
    echo "WARNING: init-backend.js not found, skipping..."
fi

# Debug: Show environment variables
echo ""
echo "=== ENVIRONMENT CHECK ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: ${PORT:-NOT SET}"
echo "DATABASE_URL: ${DATABASE_URL:+[SET]}"
echo "REDIS_URL: ${REDIS_URL:+[SET]}"
echo "Railway Domain: $RAILWAY_PUBLIC_DOMAIN_VALUE"
echo ""

# Export PORT for Medusa
export PORT=${PORT:-9000}
echo "=== PORT CONFIGURATION ==="
echo "PORT is set to: $PORT"
echo ""

# Check if .medusa/server exists
if [ ! -d ".medusa/server" ]; then
    echo "ERROR: .medusa/server directory not found!"
    echo "Build may have failed. Contents of current directory:"
    ls -la
    exit 1
fi

# Copy necessary files to .medusa/server
echo "=== Copying configuration files ==="
cp medusa-config.js .medusa/server/medusa-config.js || echo "WARNING: Failed to copy medusa-config.js"

if [ -d "src/lib" ]; then
    mkdir -p .medusa/server/src
    cp -r src/lib .medusa/server/src/lib || echo "WARNING: Failed to copy src/lib"
fi

if [ -d "src/subscribers" ]; then
    mkdir -p .medusa/server/src
    cp -r src/subscribers .medusa/server/src/subscribers || echo "WARNING: Failed to copy src/subscribers"
    echo "Subscribers directory copied"
fi

# Check what's in .medusa/server
echo ""
echo "=== Contents of .medusa/server ==="
ls -la .medusa/server/
echo ""

# Check if medusa command exists
echo "=== Checking medusa command ==="
which medusa || echo "medusa command not found in PATH"
which npx || echo "npx command not found in PATH"
echo ""

# Start Medusa with PORT environment variable
echo "=== STARTING MEDUSA ON PORT $PORT ==="
cd .medusa/server

# Medusa should pick up PORT from environment
echo "Starting medusa with PORT=$PORT environment variable..."
exec npx medusa start 2>&1