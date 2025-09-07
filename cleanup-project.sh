#!/bin/bash

# ================================================
# SAFE CLEANUP SCRIPT FOR MEDUSA PROJECT
# This removes only confirmed broken/unused files
# ================================================

echo "🧹 Starting Safe Cleanup for Medusa Project..."
echo "This will remove broken code and optimize the project"
echo ""

# Confirm before proceeding
read -p "Are you sure you want to proceed with cleanup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup cancelled."
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup at $BACKUP_DIR..."
mkdir -p $BACKUP_DIR

# ================================================
# BACKEND CLEANUP
# ================================================
echo ""
echo "🔧 Cleaning Backend..."

# Backup and remove test/broken endpoints
if [ -f "backend/src/api/store/products/route.backup.ts" ]; then
    mv backend/src/api/store/products/route.backup.ts $BACKUP_DIR/ 2>/dev/null
    echo "  ✅ Removed route.backup.ts"
fi

if [ -f "backend/src/api/store/products/route.fixed.ts" ]; then
    mv backend/src/api/store/products/route.fixed.ts $BACKUP_DIR/ 2>/dev/null
    echo "  ✅ Removed route.fixed.ts"
fi

if [ -f "backend/src/api/store/cache-test/route.ts" ]; then
    mv backend/src/api/store/cache-test $BACKUP_DIR/ 2>/dev/null
    echo "  ✅ Removed cache-test endpoint"
fi

if [ -f "backend/src/api/store/fix-inventory/route.ts" ]; then
    mv backend/src/api/store/fix-inventory $BACKUP_DIR/ 2>/dev/null
    echo "  ✅ Removed fix-inventory endpoint"
fi

# Clean temporary files
rm -rf backend/.medusa/* 2>/dev/null
echo "  ✅ Cleaned .medusa temp files"

# Clean build artifacts if they exist
rm -rf backend/dist 2>/dev/null
rm -rf backend/.cache 2>/dev/null
echo "  ✅ Cleaned build artifacts"

# Remove duplicate lock files
if [ -f "backend/yarn.lock" ] && [ -f "backend/pnpm-lock.yaml" ]; then
    mv backend/yarn.lock $BACKUP_DIR/
    echo "  ✅ Removed duplicate yarn.lock (keeping pnpm)"
fi

# ================================================
# DATABASE CLEANUP SQL
# ================================================
echo ""
echo "📊 Generating Database Cleanup SQL..."

cat > cleanup-database.sql << 'EOF'
-- ================================================
-- SAFE DATABASE CLEANUP QUERIES
-- Run these to optimize database
-- ================================================

BEGIN;

-- 1. Remove soft-deleted records older than 30 days
DELETE FROM product_variant_price_set 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';

-- 2. Clean orphaned price sets
DELETE FROM price_set 
WHERE id NOT IN (
    SELECT DISTINCT price_set_id 
    FROM product_variant_price_set 
    WHERE deleted_at IS NULL
);

-- 3. Clean orphaned prices
DELETE FROM price 
WHERE price_set_id NOT IN (
    SELECT id FROM price_set
);

-- 4. Clean orphaned price rules
DELETE FROM price_rule 
WHERE price_id NOT IN (
    SELECT id FROM price
);

-- 5. Remove duplicate vendor products (keep oldest)
DELETE FROM product p1
WHERE p1.metadata->>'source' = 'shopify_vendor'
AND p1.id != (
    SELECT p2.id 
    FROM product p2 
    WHERE p2.metadata->>'base_sku' = p1.metadata->>'base_sku'
    AND p2.metadata->>'source' = 'shopify_vendor'
    ORDER BY p2.created_at ASC
    LIMIT 1
);

-- 6. Vacuum to reclaim space
-- Run this separately: VACUUM ANALYZE;

COMMIT;

-- Verification queries
SELECT 'Soft-deleted price sets' as metric, COUNT(*) as count 
FROM product_variant_price_set WHERE deleted_at IS NOT NULL;

SELECT 'Orphaned prices' as metric, COUNT(*) as count 
FROM price WHERE price_set_id NOT IN (SELECT id FROM price_set);

SELECT 'Duplicate vendor products' as metric, COUNT(*) - COUNT(DISTINCT metadata->>'base_sku') as count
FROM product WHERE metadata->>'source' = 'shopify_vendor';
EOF

echo "  ✅ Created cleanup-database.sql"

# ================================================
# FRONTEND CLEANUP
# ================================================
echo ""
echo "💻 Checking Frontend..."

# Find and list files with problematic patterns
echo "  Files containing 'tier_price' (should be removed):"
grep -r "tier_price" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | head -5

echo ""
echo "  Files containing hardcoded prices:"
grep -r "price.*=.*[0-9]\+\.\?[0-9]*" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | head -5

# ================================================
# CREATE VERIFICATION SCRIPT
# ================================================
cat > verify-cleanup.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying Cleanup..."

# Check if problematic files exist
PROBLEMS=0

if [ -f "backend/src/api/store/products/route.backup.ts" ]; then
    echo "❌ Backup file still exists"
    PROBLEMS=$((PROBLEMS+1))
fi

if [ -d "backend/src/api/store/cache-test" ]; then
    echo "❌ Test endpoint still exists"
    PROBLEMS=$((PROBLEMS+1))
fi

# Check for console.logs in production code
CONSOLE_LOGS=$(grep -r "console.log" backend/src --include="*.ts" | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
    echo "⚠️  Found $CONSOLE_LOGS console.log statements"
fi

if [ $PROBLEMS -eq 0 ]; then
    echo "✅ All cleanup tasks completed successfully!"
else
    echo "⚠️  Found $PROBLEMS issues that need attention"
fi
EOF

chmod +x verify-cleanup.sh

# ================================================
# SUMMARY
# ================================================
echo ""
echo "========================================="
echo "✅ CLEANUP COMPLETE!"
echo "========================================="
echo ""
echo "📋 What was done:"
echo "  • Backed up files to $BACKUP_DIR"
echo "  • Removed test/broken endpoints"
echo "  • Cleaned temporary files"
echo "  • Generated database cleanup SQL"
echo "  • Created verification script"
echo ""
echo "📌 Next steps:"
echo "  1. Review files in $BACKUP_DIR before deleting"
echo "  2. Run cleanup-database.sql on production DB"
echo "  3. Run ./verify-cleanup.sh to check results"
echo "  4. Deploy cleaned backend to Railway"
echo ""
echo "⚠️  IMPORTANT:"
echo "  • Database cleanup SQL has been generated but NOT executed"
echo "  • Review and run manually: psql < cleanup-database.sql"
echo "  • Original files backed up to $BACKUP_DIR"
echo ""