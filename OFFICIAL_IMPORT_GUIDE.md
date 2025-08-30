# Official Medusa Product Import Guide

Based on official Medusa v2.8.5+ documentation

## Problem Diagnosis
Your CSV import errors are due to Medusa v2.8.5's stricter validation:
- Only accepts columns exactly matching their template
- Pre-processes entire file before import
- Requires specific workflow confirmation

## Solution 1: Use Admin UI (Recommended)

1. **Download the Official Template**
   - Go to Admin Panel: https://backend-production-7441.up.railway.app/app
   - Navigate to Products → Import
   - Download the template CSV

2. **Use the Provided CSV**
   - I've created `medusa-official-template.csv` in backend folder
   - This follows the exact column structure required
   - Contains your 2 sample products with variants

3. **Import Process**
   - Upload the CSV through the Import dialog
   - Review the preview
   - Confirm import

## Solution 2: API Import (If UI fails)

```bash
# From backend directory
curl -X POST https://backend-production-7441.up.railway.app/admin/official-import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Solution 3: Direct Database (Last Resort)

If official methods fail, use the SQL script:
```bash
railway run --service Backend psql '$DATABASE_URL' < direct-sql-import.sql
```

## Key CSV Format Requirements

### Required Columns (v2.8.5+):
- Product ID (optional - leave empty for new)
- Product Handle (optional - auto-generated if empty)
- Product Title (required)
- Product Status (published/draft)
- Variant Title
- Variant SKU
- Price columns (Price USD, etc.)
- Option 1 Name/Value (for sizes)

### Important Notes:
1. Each variant needs its own row
2. Product info repeats across variant rows
3. Leave Product ID empty for new products
4. Medusa auto-generates handles if not provided

## Troubleshooting

### "Invalid column names" error:
- You have columns not in official template
- Solution: Use exact template columns only

### "Transaction not found" error:
- Workflow confirmation issue
- Solution: Update to latest Medusa version or use direct SQL

### Import succeeds but products don't appear:
- Clear browser cache
- Logout and login again
- Check Products page filters

## Performance Tips (from v2.8.5 release):
- For large imports (1000+ products), configure S3 storage
- Import processes 1000 rows at a time
- Memory usage reduced from 4GB to 500MB

## Official Documentation:
- User Guide: https://docs.medusajs.com/user-guide/products/import
- API Reference: https://docs.medusajs.com/resources/references/medusa-workflows/importProductsWorkflow
- Admin Guide: https://docs.medusajs.com/modules/products/admin/import-products