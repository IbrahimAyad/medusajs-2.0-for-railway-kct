# 🔧 Railway Storefront Build Fix

## Problem:
Railway build failing with error:
```
cannot create subdirectories in "/app/tsconfig.tsbuildinfo": not a directory
```

## Root Cause:
Railway's Nixpacks is trying to mount `tsconfig.tsbuildinfo` as a cache directory, but it's a file.

## Solution Steps:

### 1. Create `.dockerignore` in your frontend repo
Add this to `kct-menswear-medusa-test` repo:

```dockerignore
# Next.js build output
.next
out
dist

# TypeScript cache
tsconfig.tsbuildinfo
*.tsbuildinfo

# Dependencies
node_modules

# Environment files
.env*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
*.pem

# Testing
coverage
.nyc_output

# IDE
.vscode
.idea
```

### 2. Remove `tsconfig.tsbuildinfo` if committed
```bash
git rm --cached tsconfig.tsbuildinfo
git commit -m "Remove tsconfig.tsbuildinfo from tracking"
git push
```

### 3. Alternative: Create custom Railway config
Create `railway.toml` in your frontend repo:
```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

### 4. Or disable TypeScript build info
In `tsconfig.json`, add:
```json
{
  "compilerOptions": {
    "incremental": false
  }
}
```

## After Fixing:
1. Push changes to GitHub
2. Railway will automatically rebuild
3. Build should succeed
4. Frontend will be live on Railway

## Benefits:
- Faster builds (no cache conflicts)
- Cleaner repository
- Works with both Railway and Vercel