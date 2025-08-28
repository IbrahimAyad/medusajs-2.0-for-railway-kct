# Medusa 2.0 Authentication Fix Documentation

## Problem Description
When deploying Medusa.js 2.0 on Railway, the admin login fails with "Invalid email or password" error even though the credentials are correct.

### Root Cause
The authentication system in Medusa 2.0 has two separate entities:
1. **User** - Stored in the `user` table
2. **Auth Identity** - Stored in the `auth_identity` table

When using the `/auth/user/emailpass/register` endpoint, it creates an auth identity but doesn't properly link it to a user account. The `app_metadata.user_id` field remains null, causing the JWT token to have an empty `actor_id`.

### Symptoms
- Login returns 200 status for `/auth/user/emailpass`
- But `/auth/session` returns 401 Unauthorized
- JWT token contains `"actor_id": ""`

## Solution

### Step 1: Debug Current State
Create a debug endpoint to see the current auth state:

```bash
curl https://backend-production-7441.up.railway.app/debug-auth
```

This will show:
- Existing users and their IDs
- Auth identities and their metadata
- Whether they are properly linked

### Step 2: Link Auth Identity to User
If the auth identity exists but `app_metadata` is null, you need to link it to the user.

Use the link-auth endpoint we created:
```bash
curl -X POST https://backend-production-7441.up.railway.app/link-auth
```

This updates the auth identity's `app_metadata` to include the user_id.

### Step 3: Verify Login Works
Try logging in at: `https://backend-production-7441.up.railway.app/app`

## Prevention for Future Deployments

### Proper Admin User Creation Flow
Instead of using the register endpoint, create admin users with proper linking:

1. Create the user first
2. Create auth identity with user_id in app_metadata
3. Or use the built-in seed scripts

### Environment Variables Required
```env
MEDUSA_ADMIN_EMAIL=admin@yourdomain.com
MEDUSA_ADMIN_PASSWORD=your-secure-password
JWT_SECRET=generate-secure-random-string
COOKIE_SECRET=generate-secure-random-string
DATABASE_URL=your-postgres-url
REDIS_URL=your-redis-url
```

## Key Files Created During Fix

### `/src/api/debug-auth/route.ts`
Shows current state of users and auth identities

### `/src/api/link-auth/route.ts`
Links orphaned auth identities to users

### `/src/api/fix-admin/route.ts`
Attempts to fix admin authentication issues

## Railway Deployment Notes

### Using Railway CLI
```bash
# Link to project
railway link --project PROJECT_ID

# Deploy backend
cd backend
railway up --service SERVICE_ID

# Run commands on Railway
railway run -s SERVICE_ID npm run seed:admin
```

### Auto-deployment Issues
If Railway doesn't auto-deploy from GitHub:
1. Disconnect and reconnect the repository
2. Ensure branch is set correctly (main vs master)
3. Remove upstream repo if it exists
4. Use Railway CLI for manual deployment

## Security Note
After fixing, ensure all debug endpoints are removed or secured in production.

---
*Last Updated: August 28, 2025*
*Issue resolved after identifying auth identity linking problem*