#!/bin/bash

echo "=== Direct PostgreSQL Product Import ==="
echo ""

# Your Railway PostgreSQL connection details
PGHOST="centerbeam.proxy.rlwy.net"
PGPORT="20197"
PGDATABASE="railway"
PGUSER="postgres"
PGPASSWORD="MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds"

# Export for psql
export PGPASSWORD

echo "Connecting to Railway PostgreSQL..."
echo ""

# Run the import
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE << 'EOF'
-- Quick test: Add one product
INSERT INTO product (id, handle, title, subtitle, description, status, thumbnail, created_at, updated_at)
VALUES (
  gen_random_uuid(), 
  'test-suit-direct', 
  '2 PC Double Breasted Test Suit', 
  'Testing Direct Import',
  'This is a test to see if direct SQL import works', 
  'published', 
  'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg',
  NOW(), 
  NOW()
) ON CONFLICT (handle) DO NOTHING;

-- Check if it worked
SELECT handle, title FROM product WHERE handle = 'test-suit-direct';
EOF

echo ""
echo "Check your admin panel at:"
echo "https://backend-production-7441.up.railway.app/app"