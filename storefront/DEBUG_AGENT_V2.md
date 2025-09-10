# 🐛 Debug Agent Instructions - V2
**CRITICAL UPDATE:** After 10+ hours of failed debugging

---

## 🚨 MANDATORY READING - FAILURE HISTORY

### What We Tried (And Failed):
1. **Hour 1-3:** Added `runtime = 'nodejs'` to 120+ pages → FAILED
2. **Hour 4-5:** Fixed syntax errors we created → STILL FAILED
3. **Hour 6-8:** Removed all runtime exports → MORE FAILED
4. **Hour 9-10:** Created documentation about fixes → NOTHING WORKED
5. **Result:** Complete revert, 10 hours wasted

### The Real Error We Never Fixed:
```
TypeError: n is not a function
at k (.next/server/chunks/1151.js:19:20748)
```
- **'n'** is a minified function (probably Zustand persist)
- We changed page configs instead of fixing the actual component
- The error is still there in the reverted code

---

## 🎯 How to ACTUALLY Debug

### Step 1: Local Testing ONLY
```bash
# ALWAYS test locally first
npm run build

# NEVER use Vercel as a test environment
# We wasted 200+ minutes waiting for Vercel builds
```

### Step 2: Find the REAL Error
```bash
# Get better error messages
NODE_OPTIONS='--enable-source-maps' npm run build

# Find what 'n' actually is
# It's probably one of these:
grep -r "create(" src/ --include="*.ts" --include="*.tsx"
grep -r "persist(" src/ --include="*.ts" --include="*.tsx"
grep -r "localStorage" src/ --include="*.ts" --include="*.tsx"
grep -r "window\." src/ --include="*.ts" --include="*.tsx"
```

### Step 3: Fix the ACTUAL Problem
```typescript
// The error is likely here:
const useStore = create(
  persist(
    (set) => ({ ... }),
    { name: 'store-key' }
  )
)  // This runs during SSG and breaks

// Fix:
const useStore = typeof window !== 'undefined' 
  ? create(persist(...))
  : () => ({ /* mock store */ })
```

---

## ❌ Debugging Approaches That DON'T Work

### 1. Page Configuration Changes
```typescript
// ❌ We tried all of these on 120+ pages
export const dynamic = 'force-dynamic'  // Didn't fix component issues
export const runtime = 'nodejs'         // Caused Edge conflicts
export const runtime = 'edge'           // Broke Node.js APIs

// NONE of these fixed the actual problem
```

### 2. Mass Fixes
```bash
// ❌ DON'T DO THIS
find . -name "*.tsx" -exec sed -i 's/old/new/g' {} \;

// We did this 3 times, broke everything worse each time
```

### 3. Guessing Without Understanding
```
❌ "Let's add runtime exports" - Why? "Might work"
❌ "Let's remove them all" - Why? "Might work"
❌ "Let's try edge runtime" - Why? "Might work"

✅ "The error is in useCartStore line 15" - Fix that specific line
```

---

## ✅ The Right Way to Debug

### For SSG Errors:
```typescript
// 1. Find which component is breaking
Error: n is not a function
at k (chunks/1151.js)  // This is the chunk

// 2. Find what's in that chunk
npm run build -- --debug

// 3. It's usually one of these:
- Zustand store with persist
- Component using localStorage
- Hook using window/document
- Framer-motion animation

// 4. Fix THAT specific thing
const Component = dynamic(() => import('./Component'), { 
  ssr: false 
})
```

### For TypeScript Errors:
```typescript
// For V1, just bypass:
value as any  // Fix in V2
// @ts-ignore   // Fix in V2

// Don't spend hours on type perfection
```

### For Runtime Errors:
```javascript
// Add defensive checks:
if (typeof window !== 'undefined') {
  // Browser-only code
}

// Or use dynamic imports:
const ClientOnlyComponent = dynamic(
  () => import('./Component'),
  { ssr: false }
)
```

---

## 📋 Known Issues (And Real Solutions)

### Issue 1: "TypeError: n is not a function"
**Where:** During SSG build
**Real Cause:** Zustand stores initializing at module level
**Solution:** 
```typescript
// Wrap store creation
const useStore = () => {
  if (typeof window === 'undefined') return mockStore
  return realStore
}
```

### Issue 2: "window is not defined"
**Where:** During SSG
**Real Cause:** Component accessing browser APIs
**Solution:**
```typescript
// Use dynamic import with ssr: false
export default dynamic(() => import('./Component'), {
  ssr: false
})
```

### Issue 3: Edge Runtime Conflicts
**Where:** When using runtime = 'nodejs'
**Real Cause:** Supabase needs Node.js APIs
**Solution:** Don't specify runtime, let Next.js decide

---

## 🔍 Debug Checklist

### Before You Start:
- [ ] Can you reproduce locally? (`npm run build`)
- [ ] Do you know the EXACT error?
- [ ] Do you know WHICH file is causing it?
- [ ] Have you read the error stack trace?

### If No to Any:
**STOP** - Don't guess, find out first

### Quick Fixes for V1:
```typescript
// Component breaking SSG?
dynamic(() => import('./Component'), { ssr: false })

// Store breaking SSG?
typeof window !== 'undefined' ? store : mockStore

// Type error blocking build?
value as any  // Fix in V2

// Just need it to deploy?
Ship it with warnings
```

---

## 🚀 The 30-Minute Debug Rule

### If you've spent 30 minutes:
1. **Stop debugging**
2. **Use a workaround:**
   - Make component client-only
   - Use 'any' type
   - Disable the feature
3. **Ship V1**
4. **Fix properly in V2**

### Why:
We spent 10 hours debugging. It all got reverted.
30 minutes of workarounds would have shipped V1.

---

## 📊 Debug Priority for V1

### Critical (Fix Now):
```
✅ Deployment blockers ONLY
```

### Not Critical (Fix in V2):
```
❌ TypeScript warnings
❌ Console.log statements  
❌ Performance optimizations
❌ SSG optimizations
❌ Perfect error handling
```

---

## 🔴 FINAL WARNING

### What We Did Wrong:
- Debugged for 10+ hours
- Fixed nothing
- Made everything worse
- Had to revert everything

### What You Should Do:
- Debug for 30 minutes max
- Use workarounds for V1
- Ship working code
- Fix properly in V2

### Remember:
**A deployed site with workarounds > A perfect site that won't deploy**

---

## 🎯 Your Mission

### For V1:
1. Make it deploy (use any workaround needed)
2. Make core features work
3. Ship it

### For V2:
1. Fix things properly
2. Remove workarounds
3. Optimize

**Time Budget:** 
- V1: 3-4 hours MAX
- Not 10 hours of failed debugging

---

*This guide exists because we failed for 10 hours. Learn from our mistakes.*