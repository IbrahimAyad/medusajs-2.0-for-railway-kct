# ⚠️ DO's AND DON'Ts - LEARNED THE HARD WAY

*Based on 10+ hours of failed debugging attempts*

---

## 🔴 DON'T - Things That Wasted Our Time

### ❌ DON'T Mass-Edit Files
```bash
# WHAT WE DID WRONG
sed -i "add-runtime-export" **/*.tsx  # Changed 120 files
# Result: Created 68 syntax errors, fixed nothing

# WHAT WE SHOULD HAVE DONE
# Fix ONE file, test, then continue
```

### ❌ DON'T Trust Previous Documentation
```markdown
# WHAT WE SAW
"✅ Fixed 98% of TypeScript errors"
"✅ Build should complete successfully"

# WHAT WAS TRUE
Nothing was fixed, every build failed
TypeScript was just disabled, not fixed
```

### ❌ DON'T Fix Without Understanding
```javascript
// WHAT WE DID
"Let's add export const runtime = 'nodejs' everywhere"
// Why? "It might work"

// WHAT WE SHOULD HAVE DONE
"The error is 'n is not a function' at line 47 in useStore"
"n is the persist function being called during SSG"
"Here's the specific fix for that line"
```

### ❌ DON'T Use Vercel as Test Environment
```
WHAT WE DID:
Push → Wait 10 min → Failed
Push → Wait 10 min → Failed  
Push → Wait 10 min → Failed
(20+ times = 200+ minutes wasted)

SHOULD HAVE DONE:
npm run build (30 seconds locally)
```

### ❌ DON'T Add Configurations Blindly
```typescript
// WHAT WE ADDED EVERYWHERE
export const runtime = 'nodejs'  // Broke Edge Runtime
export const runtime = 'edge'    // Broke Node APIs
export const dynamic = 'force-dynamic' // Didn't fix component issues

// NONE OF THESE FIXED THE ACTUAL PROBLEM
```

### ❌ DON'T Compound Fixes on Broken Code
```
Hour 1: Add runtime exports → Broken
Hour 2: Fix syntax from Hour 1 → Still broken
Hour 3: Remove exports from Hour 1 → More broken
Hour 4: Add different exports → Even more broken
Result: 4 hours deeper in problems
```

---

## ✅ DO - Things That Actually Work

### ✅ DO Test Locally First
```bash
# ALWAYS DO THIS FIRST
npm run build

# See errors immediately
# No waiting for Vercel
# Instant feedback
```

### ✅ DO Understand the Error
```javascript
// READ THE ACTUAL ERROR
TypeError: n is not a function
at k (.next/server/chunks/1151.js:19:20748)

// FIND WHAT 'n' IS
# Use source maps
NODE_OPTIONS='--enable-source-maps' npm run build

// FIND THE REAL CODE
# It's probably a store or hook
grep -r "create(" src/
grep -r "localStorage" src/
```

### ✅ DO Fix One Thing at a Time
```bash
# GOOD APPROACH
1. Find failing component
2. Fix that component
3. Test locally
4. Commit if working
5. Move to next issue

# NOT
"Let's fix all 120 pages at once"
```

### ✅ DO Use Git Branches
```bash
# ALWAYS
git checkout -b fix-deployment-issue
# Make changes
# Test
git add . && git commit -m "Fix: specific issue"

# ONLY IF WORKING
git checkout main
git merge fix-deployment-issue
```

### ✅ DO Quick Fixes for V1
```typescript
// If a component breaks SSG, just make it client-only
import dynamic from 'next/dynamic'

const SafeComponent = dynamic(
  () => import('./ProblematicComponent'),
  { ssr: false }
)

// Ship it, optimize later
```

### ✅ DO Accept Imperfection
```javascript
// VERSION 1.0
if (itDeploys && usersCanBuy) {
  ship(); // GOOD ENOUGH
}

// VERSION 2.0
if (perfect && optimized && noWarnings) {
  ship(); // DO THIS LATER
}
```

---

## 📋 QUICK DECISION TREE

```
Build failing?
├─ Do you understand the exact error?
│  ├─ NO → Find what's actually breaking (DON'T guess)
│  └─ YES → Fix ONLY that specific issue
│
├─ Is it blocking deployment?
│  ├─ YES → Quick fix it (client-only wrap)
│  └─ NO → Skip it for V1
│
└─ Did your fix work locally?
   ├─ NO → DON't push, try different approach
   └─ YES → Push and verify
```

---

## 🎯 THE GOLDEN RULES

### Rule 1: Test Locally
```bash
npm run build > push to vercel
30 seconds > 10 minutes
```

### Rule 2: One Change
```bash
1 file changed > 120 files changed
Easy to revert > Impossible to debug
```

### Rule 3: Understand First
```bash
"I know why it's breaking" > "This might work"
Targeted fix > Shotgun approach
```

### Rule 4: Ship Working Code
```bash
Deployed with warnings > Perfect but not deployed
V1 with issues > No V1 at all
```

---

## 🚨 RED FLAGS TO AVOID

### 🚩 "Let's fix everything at once"
**Reality:** You'll fix nothing and break more

### 🚩 "This should work"
**Reality:** It won't. Test it first.

### 🚩 "The documentation says it's fixed"
**Reality:** Check the actual build status

### 🚩 "Let's add this to all files"
**Reality:** You're about to break 100+ files

### 🚩 "Vercel will tell us if it works"
**Reality:** You're wasting 10 minutes per test

---

## ✅ GREEN FLAGS TO FOLLOW

### 🟢 "Let me test this locally first"
**Result:** Instant feedback

### 🟢 "I found the exact line causing the error"
**Result:** Targeted fix that works

### 🟢 "Let's fix just this one component"
**Result:** Incremental progress

### 🟢 "This works locally, now I'll push"
**Result:** Confident deployment

### 🟢 "Good enough for V1, perfect for V2"
**Result:** Shipped product

---

## 📊 TIME MATH

### What We Did (DON'T):
```
120 files × 3 attempts × 10 min/deploy = 36 hours of waiting
Result: Nothing fixed
```

### What We Should Do (DO):
```
1 problem × 1 fix × 30 sec test = 30 seconds
Result: Problem solved
```

---

## 🎓 FINAL WISDOM

**If you remember nothing else:**

1. **BUILD LOCALLY FIRST** - Always
2. **FIX ONE THING** - Not everything
3. **UNDERSTAND THE ERROR** - Don't guess
4. **SHIP WORKING CODE** - Not perfect code
5. **USE BRANCHES** - Protect main

**The 10 hours we lost taught us:**
- Bulk fixes don't work
- Vercel isn't a test environment
- Documentation can lie
- Understanding > Guessing
- Simple > Complex
- Done > Perfect

---

*These aren't suggestions. They're battle scars from 10 hours of failure. Learn from our pain.*