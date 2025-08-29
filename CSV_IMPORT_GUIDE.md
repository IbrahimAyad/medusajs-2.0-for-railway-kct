# CSV Import Guide for KCT Menswear Medusa 2.0

## Known Issues and Solutions

### 1. Products Not Saving After Import
**Issue**: CSV uploads successfully, recognizes products, shows "deploying products" but products don't actually save.

**Causes**:
- Long-running workflows getting stuck in "invoking" state (known Medusa 2.0 bug)
- Worker mode not properly configured
- CSV format issues

**Solutions**:
1. Ensure `MEDUSA_WORKER_MODE=shared` is set in Railway environment variables ✅ (DONE)
2. Use smaller CSV files (max ~15 rows at a time)
3. Check exact column header formatting (case-sensitive)
4. If stuck, may need to truncate `batch_job` table in database

### 2. CSV Format Requirements

**Critical Headers** (must match exactly, case-sensitive):
- `Product Id` (not "Product id" or "product ID")
- `Product Handle` (URL-friendly identifier)
- `Product Title`
- `Product Status` (draft/published)
- `Variant SKU` (unique per variant)
- `Price USD` or currency columns

**Important Notes**:
- Leave `Product Id` and `Variant Id` empty for new products
- Each row represents a variant
- Multiple rows with same `Product Handle` create variants
- Status must be "published" or "draft"

### 3. Testing Process

1. Start with small test file (3-5 products max)
2. Use the template from admin panel: Settings → Import Products → Download Template
3. Check logs at: Settings → Workflows (to see if stuck in "invoking")
4. If import fails, check:
   - Column headers match exactly
   - No special characters in data
   - All required fields present

### 4. File Storage Configuration

**R2/S3 Configuration Status**:
- Cloudflare R2 credentials are set in Railway
- File provider should use R2 for presigned URLs
- Check configuration at `/store/config-status` endpoint

### 5. Troubleshooting Commands

```bash
# Check if worker is running properly
railway logs --service Backend | grep -i worker

# Check for workflow errors
railway logs --service Backend | grep -i "workflow"

# Monitor CSV import
railway logs --service Backend | grep -i "import"
```

### 6. Database Cleanup (if needed)

If imports are stuck, you may need to clean the database:
```sql
-- Check stuck batch jobs
SELECT * FROM batch_job WHERE status = 'processing';

-- Clean stuck jobs (use with caution)
TRUNCATE TABLE batch_job CASCADE;
```

## Next Steps

1. Test with `test-import-small.csv` (3 products)
2. Monitor workflow execution in admin panel
3. If successful, gradually increase batch size
4. Import full catalog in batches

## Support

- Medusa Discord: https://discord.gg/medusajs
- GitHub Issues: https://github.com/medusajs/medusa/issues
- Railway Support: https://railway.app/help