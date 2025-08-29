# Railway Deployment Guide for KCT Medusa Backend

## ⚠️ IMPORTANT: Deployment Directory

**ALWAYS deploy from the PROJECT ROOT directory**, not from the backend folder!

### Correct Way to Deploy:
```bash
# Navigate to project root
cd /Users/ibrahim/Desktop/medusa-railway-setup

# Deploy to Railway (from project root)
railway up --detach --service Backend
```

### ❌ WRONG Way (will cause "Could not find root directory" error):
```bash
# DON'T do this:
cd /Users/ibrahim/Desktop/medusa-railway-setup/backend
railway up --detach --service Backend
```

## Why This Happens

Railway is configured with:
- **Root Directory**: `/backend` (set in Railway Settings)
- When you deploy from project root, Railway correctly finds the `/backend` folder
- When you deploy from `/backend` folder, Railway looks for `/backend/backend` which doesn't exist

## Quick Deployment Commands

### Deploy Backend:
```bash
cd ~/Desktop/medusa-railway-setup
railway up --detach --service Backend
```

### Check Status:
```bash
./check-deployment.sh
```

### View Logs:
```bash
railway logs --service Backend | tail -50
```

### Check Health:
```bash
curl https://backend-production-7441.up.railway.app/health
```

## Environment Variables

Set these in Railway dashboard or via CLI:
```bash
railway variables --set KEY=value --service Backend
```

Required variables:
- `DATABASE_URL` (auto-configured)
- `REDIS_URL` (auto-configured)
- `JWT_SECRET` (auto-generated)
- `COOKIE_SECRET` (auto-generated)
- `MEDUSA_WORKER_MODE=shared`

Optional (for features):
- `S3_ACCESS_KEY_ID` (for R2 storage)
- `S3_SECRET_ACCESS_KEY` (for R2 storage)
- `S3_BUCKET` (for R2 storage)
- `S3_ENDPOINT` (for R2 storage)
- `STRIPE_API_KEY` (for payments)
- `STRIPE_WEBHOOK_SECRET` (for payments)

## Troubleshooting

### If deployment fails with "Could not find root directory":
1. Check you're in the project root: `pwd` should show `/Users/ibrahim/Desktop/medusa-railway-setup`
2. Check Railway Settings shows Root Directory as `/backend`
3. Deploy from project root, not backend folder

### If build times out:
1. Railway free tier may have resource limits
2. Try deploying during off-peak hours
3. Consider upgrading to Railway Hobby plan ($5/month)

### If CSV import doesn't save products:
1. Check Admin → Settings → Workflows for stuck jobs
2. Import in small batches (max 15 rows)
3. May need to clean database: `TRUNCATE TABLE batch_job CASCADE;`

## Admin Access

- **URL**: https://backend-production-7441.up.railway.app/app
- **Email**: admin@kctmenswear.com
- **Password**: 127598

## Support

- Railway Status: https://railway.app/status
- Medusa Discord: https://discord.gg/medusajs
- GitHub Issues: https://github.com/medusajs/medusa/issues