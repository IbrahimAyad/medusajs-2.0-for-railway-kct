# KCT Menswear Deployment Checklist

## Pre-Deployment Verification

### 1. Environment Variables (Vercel Dashboard)
Ensure ALL these are set in Vercel:
- [ ] `NEXT_PUBLIC_KNOWLEDGE_BANK_API` = https://kct-knowledge-api-production.up.railway.app
- [ ] `NEXT_PUBLIC_KNOWLEDGE_BANK_KEY` = kct-menswear-api-2024-secret
- [ ] `NEXT_PUBLIC_SIZE_BOT_API` = https://kct-sizebot-api-production.up.railway.app  
- [ ] `NEXT_PUBLIC_SIZE_BOT_KEY` = kct-menswear-api-2024-secret
- [ ] `NEXT_PUBLIC_FASHION_CLIP_API` = https://fashion-clip-kct-production.up.railway.app
- [ ] `NEXT_PUBLIC_FASHION_CLIP_KEY` = kct-menswear-api-2024-secret
- [ ] `REPLICATE_API_TOKEN` = r8_REDACTED
- [ ] `NEXT_PUBLIC_ADMIN_API_URL` = https://kct-menswear.vercel.app/api
- [ ] `NEXT_PUBLIC_ADMIN_API_KEY` = [Your actual key]

### 2. Common Build Issues & Fixes

#### TypeScript Errors
- **Issue**: Strict type checking failures
- **Fix**: Use type assertions or proper typing
- **Prevention**: Run `npx tsc --noEmit` locally

#### Missing Dependencies
- **Issue**: Module not found errors
- **Fix**: Check package.json has all imports
- **Prevention**: Run `npm ls` to verify

#### Canvas-Confetti Specific
- **Issue**: canvas-confetti module not found
- **Fix**: Ensure both dependencies exist:
  ```json
  "canvas-confetti": "^1.9.3",
  "@types/canvas-confetti": "^1.6.7"
  ```

#### Dynamic Imports
- **Issue**: Server-side rendering of client components
- **Fix**: Use dynamic imports with `ssr: false`
- **Example**:
  ```tsx
  const MicroInteractions = dynamic(
    () => import('@/components/ui/micro-interactions'),
    { ssr: false }
  );
  ```

### 3. Build Commands

```bash
# Local verification before pushing
npm install
npm run build

# Quick checks
node build-check.js
```

### 4. Vercel Settings
- Node Version: 18.x or 20.x
- Build Command: `npm run build` (NOT vite build)
- Output Directory: `.next` (automatic)
- Install Command: `npm install`

### 5. Known Working Configuration
- Next.js: 15.3.5
- React: 19.0.0
- Node: 18.x+
- Framework Preset: Next.js (automatic)

### 6. If Build Fails
1. Check Vercel build logs for specific error
2. Match error to common issues above
3. Fix locally and test with `npm run build`
4. Push fix and redeploy

### 7. Post-Deployment Verification
- [ ] Homepage loads
- [ ] API routes respond (check /api/health if exists)
- [ ] Static assets load (images, styles)
- [ ] Environment-dependent features work (APIs)