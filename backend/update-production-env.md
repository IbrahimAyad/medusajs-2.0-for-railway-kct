# Fix Admin Panel Authentication - Production Environment Variables

## Problem
The admin panel at https://backend-production-7441.up.railway.app/app is showing 401 errors because the JWT and cookie secrets are set to placeholder values.

## Solution
Set these environment variables in Railway production environment:

### Required Secrets
```
JWT_SECRET=Fkcoo41/fkWUNM9HJViDXxMliVjVH99v2icEnTnrU+k=
COOKIE_SECRET=GZKaBQcFZkq/+YvnVr7xMz11YH/ycJqLBl+g/lAUx5I=
```

### CORS Configuration
```
ADMIN_CORS=http://localhost:7000,http://localhost:7001,https://storefront-production-c1c6.up.railway.app,https://kct-menswear-medusa-test.vercel.app,https://backend-production-7441.up.railway.app
STORE_CORS=http://localhost:8000,https://storefront-production-c1c6.up.railway.app,https://kct-menswear-medusa-test.vercel.app,https://backend-production-7441.up.railway.app
AUTH_CORS=http://localhost:7000,http://localhost:7001,https://storefront-production-c1c6.up.railway.app,https://kct-menswear-medusa-test.vercel.app,https://backend-production-7441.up.railway.app
```

## How to Apply
1. Go to Railway dashboard
2. Select the backend service
3. Go to Variables tab
4. Update the JWT_SECRET and COOKIE_SECRET variables
5. Update the CORS variables to include the admin panel domain
6. Deploy the changes

## What This Fixes
- Admin users can now authenticate properly
- JWT tokens will be signed with a proper secret
- Cookies will be signed securely
- Admin panel CORS will allow requests from the correct domain
- All admin API endpoints will work correctly

## Files Changed
- `src/api/middlewares/authenticate-admin.ts` (new admin authentication middleware)
- `src/api/middlewares.ts` (updated to use authentication middleware)

The authentication middleware ensures all admin routes require proper JWT authentication and validates user credentials before allowing access to admin functionality.