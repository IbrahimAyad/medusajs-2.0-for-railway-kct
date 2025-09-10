# 🔑 Solution Document: Exposed API Keys

**Issue ID:** CRITICAL-001  
**Severity:** 🔴 CRITICAL  
**Impact:** Complete compromise of external services  
**Time to Fix:** 2-4 hours  

---

## 📋 Problem Description

### What's Happening
Multiple production API keys are exposed in the codebase, specifically in `.env.local` and potentially committed to version control:

```bash
# EXPOSED KEYS FOUND:
Railway API: kct-menswear-api-2024-secret
Replicate API: r8_REDACTED
```

### Security Impact
- **Immediate Risk:** Unauthorized access to Railway infrastructure
- **Financial Risk:** Potential billing abuse on Replicate AI services
- **Data Risk:** Possible access to production databases and services
- **Reputation Risk:** If discovered, could damage trust and compliance status

---

## 🔍 Root Cause Analysis

Based on research of our documentation:

### From CLAUDE.md Analysis
- Previous security implementations failed due to rushed fixes
- Environment variable management hasn't been properly documented
- No systematic process for handling secrets in development vs production

### Code Investigation
1. **Location:** `/Users/ibrahim/Desktop/Unified X/kct-menswear-v2/kct-menswear-v2/.env.local`
2. **Git Status:** These keys may be in commit history
3. **Usage:** Keys are referenced across multiple service files

---

## 🛠️ Previous Work & Lessons Learned

### From Our Documentation Review
1. **CSRF Implementation Failure (CLAUDE.md):**
   - Previous security implementations failed due to mixing React components with security logic
   - Team tendency to rush security fixes without proper testing

2. **Environment Variable Patterns Found:**
   - Inconsistent naming conventions across services
   - Development keys mixed with production configurations
   - No clear rotation strategy documented

---

## ✅ Complete Solution Strategy

### Phase 1: Immediate Containment (30 minutes)
1. **Rotate All Exposed Keys**
   ```bash
   # Railway Platform
   1. Login to Railway dashboard
   2. Navigate to API Keys section
   3. Revoke: kct-menswear-api-2024-secret
   4. Generate new key: kct-menswear-api-2025-production
   
   # Replicate Platform
   1. Login to Replicate dashboard
   2. Navigate to Account Settings > API tokens
   3. Revoke: r8_REDACTED
   4. Generate new token with limited scope
   ```

2. **Remove Keys from Codebase**
   ```bash
   # Remove from .env.local
   rm .env.local
   
   # Check git history for exposure
   git log --oneline --all -- .env.local
   git log --grep="API" --grep="key" --all
   ```

### Phase 2: Secure Configuration (1 hour)
1. **Create Environment-Specific Configurations**
   ```bash
   # .env.example (safe to commit)
   RAILWAY_API_KEY=your_railway_api_key_here
   REPLICATE_API_TOKEN=your_replicate_token_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # .env.local (never commit)
   RAILWAY_API_KEY=rw_prod_new_secure_key_here
   REPLICATE_API_TOKEN=r8_REDACTED_secure_token_here
   ```

2. **Update .gitignore Protection**
   ```bash
   # Add to .gitignore if not present
   echo ".env.local" >> .gitignore
   echo ".env.production" >> .gitignore
   echo "*.key" >> .gitignore
   echo "*.secret" >> .gitignore
   ```

### Phase 3: Production Deployment (30 minutes)
1. **Vercel Environment Variables**
   ```bash
   # Set via Vercel dashboard or CLI
   vercel env add RAILWAY_API_KEY
   vercel env add REPLICATE_API_TOKEN
   
   # Ensure environment-specific values
   # Development: Limited scope tokens
   # Production: Full access tokens
   ```

2. **Key Validation Implementation**
   ```typescript
   // src/lib/config/api-keys.ts
   export function validateApiKeys() {
     const requiredKeys = [
       'RAILWAY_API_KEY',
       'REPLICATE_API_TOKEN'
     ];
     
     const missing = requiredKeys.filter(key => !process.env[key]);
     
     if (missing.length > 0) {
       throw new Error(`Missing required API keys: ${missing.join(', ')}`);
     }
     
     // Validate key formats
     if (!process.env.RAILWAY_API_KEY?.startsWith('rw_')) {
       throw new Error('Invalid Railway API key format');
     }
     
     if (!process.env.REPLICATE_API_TOKEN?.startsWith('r8_REDACTED')) {
       throw new Error('Invalid Replicate API token format');
     }
   }
   ```

### Phase 4: Git History Cleanup (1 hour)
1. **Remove Keys from Git History**
   ```bash
   # Use BFG Repo-Cleaner for sensitive data
   java -jar bfg.jar --replace-text passwords.txt
   
   # Alternative: filter-branch (more manual)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.local' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (dangerous - coordinate with team)
   git push origin --force --all
   ```

2. **Create passwords.txt for BFG**
   ```
   kct-menswear-api-2024-secret
   r8_REDACTED
   ```

---

## 🧪 Testing & Verification

### 1. Service Connectivity Tests
```typescript
// src/scripts/test-api-keys.ts
import { validateApiKeys } from '@/lib/config/api-keys';

async function testRailwayConnection() {
  try {
    const response = await fetch('https://backboard.railway.app/graphql', {
      headers: {
        'Authorization': `Bearer ${process.env.RAILWAY_API_KEY}`,
      }
    });
    console.log('Railway API:', response.ok ? '✅ Connected' : '❌ Failed');
  } catch (error) {
    console.error('Railway test failed:', error);
  }
}

async function testReplicateConnection() {
  try {
    const response = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
      }
    });
    console.log('Replicate API:', response.ok ? '✅ Connected' : '❌ Failed');
  } catch (error) {
    console.error('Replicate test failed:', error);
  }
}

validateApiKeys();
await testRailwayConnection();
await testReplicateConnection();
```

### 2. Environment Validation
```bash
# Run this after key rotation
npm run test:api-keys
npm run build  # Ensure build succeeds
npm run start  # Test production build
```

---

## 🛡️ Prevention Strategies

### 1. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run security:check"
    }
  },
  "scripts": {
    "security:check": "node scripts/check-secrets.js"
  }
}
```

### 2. Secret Detection Script
```javascript
// scripts/check-secrets.js
const fs = require('fs');
const path = require('path');

const PATTERNS = [
  /rw_[a-zA-Z0-9]+/g,           // Railway keys
  /r8_REDACTED[a-zA-Z0-9]+/g,           // Replicate tokens
  /sk_live_[a-zA-Z0-9]+/g,      // Stripe live keys
  /pk_live_[a-zA-Z0-9]+/g,      // Stripe public keys
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      violations.push(...matches);
    }
  });
  
  return violations;
}

// Scan all files except node_modules
// Exit with error if secrets found
```

### 3. Development Workflow
```bash
# Development environment setup
cp .env.example .env.local
# Edit .env.local with development keys
# Never commit .env.local

# Production deployment
# Set environment variables in Vercel dashboard
# Use Vercel CLI for automated deployment
```

---

## 📊 Monitoring & Alerts

### 1. Key Usage Monitoring
```typescript
// src/lib/monitoring/api-usage.ts
export function trackApiUsage(service: string, endpoint: string) {
  // Log API usage for billing monitoring
  console.log(`API_USAGE: ${service}:${endpoint} at ${new Date().toISOString()}`);
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Implement with your monitoring solution
  }
}
```

### 2. Suspicious Activity Detection
```typescript
// Monitor for unusual API usage patterns
// Set up alerts for:
// - High volume of requests
// - Failed authentication attempts
// - Access from unusual locations
```

---

## 🚨 Emergency Response Plan

### If Keys Are Compromised Again
1. **Immediate Actions (5 minutes)**
   - Revoke all keys across all platforms
   - Change Vercel environment variables
   - Deploy with new keys

2. **Assessment (15 minutes)**
   - Check service logs for unauthorized usage
   - Review billing for unexpected charges
   - Scan git history for additional exposure

3. **Communication (30 minutes)**
   - Notify team of the incident
   - Document lessons learned
   - Update security procedures

---

## ✅ Success Criteria

### Immediate (After Implementation)
- [ ] All old API keys revoked
- [ ] New keys working in development
- [ ] New keys deployed to production
- [ ] Git history cleaned of sensitive data
- [ ] .env.local removed from repository

### Ongoing (After 1 week)
- [ ] No unauthorized API usage detected
- [ ] All services functioning normally
- [ ] Pre-commit hooks preventing future exposure
- [ ] Team trained on secure practices

---

## 📝 Documentation Updates Required

1. **CLAUDE.md**
   - Add section on environment variable management
   - Document key rotation procedures
   - Add security checklist for future implementations

2. **README.md**
   - Update setup instructions with .env.example
   - Add security considerations section
   - Document API key requirements

3. **New File: SECURITY.md**
   - Comprehensive security guidelines
   - Incident response procedures
   - Contact information for security issues

---

## 🔗 Related Issues to Address

1. **Console.log Statements** - May contain sensitive data
2. **Webhook Security** - Related to API authentication
3. **Database Access** - Review connection string security
4. **CSRF Protection** - Previous implementation failed

---

**Priority:** 🔴 HIGHEST - Implement immediately  
**Dependencies:** None - can be done independently  
**Estimated Timeline:** 4 hours total (2 hours minimum for basic fix)  
**Risk if Delayed:** Complete infrastructure compromise