# 🔐 Solution Document: Webhook Signature Verification

**Issue ID:** CRITICAL-005  
**Severity:** 🔴 CRITICAL  
**Impact:** Webhook security bypassed - "return true" allowing unauthorized access  
**Time to Fix:** 30-60 minutes  

---

## 📋 Problem Description

### What's Happening
The webhook signature verification in our admin products endpoint is completely bypassed with a dangerous "return true" statement:

```typescript
// FOUND IN: src/app/api/webhooks/admin/products/route.ts:87
return true; // Simplified for development ❌
```

### Security Impact
- **Complete Bypass:** Any external party can trigger webhook endpoints
- **Data Manipulation:** Unauthorized product updates, deletions, or creation
- **CSRF Attacks:** Cross-site request forgery without authentication
- **DoS Potential:** Malicious actors can spam webhook endpoints
- **Compliance Risk:** Fails security audits and PCI compliance requirements

---

## 🔍 Root Cause Analysis

### From CLAUDE.md Research
Our documentation shows this is a recurring pattern:

> **CSRF Implementation Error (DO NOT REPEAT)**
> - Previous security implementations failed due to rushed fixes
> - Team tendency to rush security fixes without proper testing
> - Security features being disabled for "development convenience"

### Code Investigation
1. **Location:** `/src/app/api/webhooks/admin/products/route.ts:87`
2. **Function:** `verifySignature()` returns hardcoded `true`
3. **Impact:** All webhook security checks bypassed
4. **Usage:** Admin product webhooks completely unsecured

### From Our Documentation
We have previous experience with webhook security:
- `/docs/fix-backend-webhook.md` mentions HMAC signature patterns
- Supabase edge functions show proper webhook verification implementation
- Previous webhook implementations were functional

---

## 🛠️ Previous Solutions & Lessons Learned

### From Supabase Edge Functions
Found working webhook security in our edge functions:

```typescript
// Working pattern from supabase/functions/kct-webhook/index.ts
const signature = headers.get('stripe-signature');
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

try {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
} catch (err) {
  console.error('Webhook signature verification failed:', err.message);
  return new Response('Webhook signature verification failed', { status: 400 });
}
```

### Security Patterns Found
1. **HMAC-SHA256 verification** for secure webhooks
2. **Environment variable secrets** properly used
3. **Timestamp validation** to prevent replay attacks
4. **Proper error responses** without information leakage

---

## ✅ Complete Solution Strategy

### Phase 1: Immediate Security Fix (15 minutes)

1. **Replace Bypassed Verification**
   ```typescript
   // src/app/api/webhooks/admin/products/route.ts
   import crypto from 'crypto';
   
   interface WebhookHeaders {
     'x-signature'?: string;
     'x-timestamp'?: string;
     'user-agent'?: string;
   }
   
   function verifySignature(
     payload: string, 
     signature: string, 
     secret: string,
     timestamp?: string
   ): boolean {
     try {
       // Validate required parameters
       if (!payload || !signature || !secret) {
         console.error('Missing required parameters for signature verification');
         return false;
       }
   
       // Validate timestamp (prevent replay attacks)
       if (timestamp) {
         const requestTime = parseInt(timestamp);
         const currentTime = Math.floor(Date.now() / 1000);
         const timeDifference = Math.abs(currentTime - requestTime);
         
         // Reject requests older than 5 minutes
         if (timeDifference > 300) {
           console.error('Request timestamp too old:', timeDifference);
           return false;
         }
       }
   
       // Create expected signature
       const expectedSignature = crypto
         .createHmac('sha256', secret)
         .update(timestamp ? `${timestamp}.${payload}` : payload)
         .digest('hex');
   
       // Use secure comparison to prevent timing attacks
       const providedSignature = signature.replace('sha256=', '');
       
       return crypto.timingSafeEqual(
         Buffer.from(expectedSignature, 'hex'),
         Buffer.from(providedSignature, 'hex')
       );
     } catch (error) {
       console.error('Signature verification error:', error);
       return false;
     }
   }
   ```

2. **Update Webhook Handler**
   ```typescript
   // Replace the current webhook handler
   export async function POST(request: NextRequest) {
     try {
       // Get raw body for signature verification
       const rawBody = await request.text();
       const signature = request.headers.get('x-signature');
       const timestamp = request.headers.get('x-timestamp');
       const webhookSecret = process.env.WEBHOOK_SECRET || process.env.ADMIN_WEBHOOK_SECRET;
   
       // Verify webhook signature
       if (!webhookSecret) {
         console.error('Webhook secret not configured');
         return NextResponse.json(
           { error: 'Webhook configuration error' },
           { status: 500 }
         );
       }
   
       if (!signature) {
         console.error('Missing webhook signature');
         return NextResponse.json(
           { error: 'Missing signature' },
           { status: 401 }
         );
       }
   
       // Verify the signature
       const isValid = verifySignature(rawBody, signature, webhookSecret, timestamp);
       
       if (!isValid) {
         console.error('Webhook signature verification failed');
         return NextResponse.json(
           { error: 'Invalid signature' },
           { status: 401 }
         );
       }
   
       // Parse body after verification
       const body = JSON.parse(rawBody);
       
       // Continue with webhook processing...
       return await processWebhookEvent(body);
       
     } catch (error) {
       console.error('Webhook processing error:', error);
       return NextResponse.json(
         { error: 'Webhook processing failed' },
         { status: 500 }
       );
     }
   }
   ```

### Phase 2: Environment Configuration (10 minutes)

1. **Add Webhook Secrets**
   ```bash
   # .env.local (development)
   WEBHOOK_SECRET=dev_webhook_secret_32_chars_minimum
   ADMIN_WEBHOOK_SECRET=admin_webhook_secret_32_chars_minimum
   
   # .env.example (safe to commit)
   WEBHOOK_SECRET=your_webhook_secret_here
   ADMIN_WEBHOOK_SECRET=your_admin_webhook_secret_here
   ```

2. **Production Environment Variables**
   ```bash
   # Add to Vercel dashboard or CI/CD
   WEBHOOK_SECRET=prod_secure_webhook_secret_64_chars_recommended
   ADMIN_WEBHOOK_SECRET=prod_admin_webhook_secret_64_chars_recommended
   ```

3. **Generate Secure Secrets**
   ```bash
   # Generate cryptographically secure secrets
   openssl rand -hex 32  # For WEBHOOK_SECRET
   openssl rand -hex 32  # For ADMIN_WEBHOOK_SECRET
   
   # Or use Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Phase 3: Additional Security Hardening (15 minutes)

1. **Add Rate Limiting**
   ```typescript
   // src/lib/utils/rate-limiter.ts
   const requestCounts = new Map<string, { count: number; resetTime: number }>();
   
   export function rateLimitWebhook(clientIP: string, maxRequests = 10, windowMs = 60000): boolean {
     const now = Date.now();
     const clientData = requestCounts.get(clientIP);
   
     if (!clientData || now > clientData.resetTime) {
       requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
       return true;
     }
   
     if (clientData.count >= maxRequests) {
       return false; // Rate limit exceeded
     }
   
     clientData.count++;
     return true;
   }
   
   // Usage in webhook handler:
   const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
   
   if (!rateLimitWebhook(clientIP)) {
     return NextResponse.json(
       { error: 'Rate limit exceeded' },
       { status: 429 }
     );
   }
   ```

2. **Request Validation**
   ```typescript
   function validateWebhookRequest(request: NextRequest): { isValid: boolean; error?: string } {
     // Check Content-Type
     const contentType = request.headers.get('content-type');
     if (!contentType?.includes('application/json')) {
       return { isValid: false, error: 'Invalid content type' };
     }
   
     // Check User-Agent (if you have specific webhook senders)
     const userAgent = request.headers.get('user-agent');
     if (userAgent && !isAllowedUserAgent(userAgent)) {
       return { isValid: false, error: 'Invalid user agent' };
     }
   
     // Check request size
     const contentLength = parseInt(request.headers.get('content-length') || '0');
     if (contentLength > 1048576) { // 1MB limit
       return { isValid: false, error: 'Request too large' };
     }
   
     return { isValid: true };
   }
   
   function isAllowedUserAgent(userAgent: string): boolean {
     const allowedAgents = [
       'Stripe/',
       'GitHub-Hookshot/',
       'YourService/',
       // Add your trusted webhook senders
     ];
     
     return allowedAgents.some(agent => userAgent.startsWith(agent));
   }
   ```

### Phase 4: Monitoring & Alerting (10 minutes)

1. **Security Event Logging**
   ```typescript
   // src/lib/security/webhook-monitor.ts
   interface SecurityEvent {
     type: 'signature_failure' | 'rate_limit' | 'invalid_request';
     clientIP: string;
     timestamp: string;
     details: any;
   }
   
   export function logSecurityEvent(event: SecurityEvent) {
     // Log to your security monitoring service
     console.error('SECURITY_EVENT:', JSON.stringify(event));
     
     // Send to monitoring service (Sentry, DataDog, etc.)
     if (process.env.NODE_ENV === 'production') {
       // Implement your monitoring integration
       fetch('/api/security/events', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(event)
       }).catch(() => {
         // Silent failure - don't break webhook processing
       });
     }
   }
   
   // Usage in webhook handler:
   if (!isValid) {
     logSecurityEvent({
       type: 'signature_failure',
       clientIP: getClientIP(request),
       timestamp: new Date().toISOString(),
       details: {
         providedSignature: signature,
         hasTimestamp: !!timestamp,
         bodyLength: rawBody.length
       }
     });
   }
   ```

---

## 🧪 Testing & Verification

### 1. Manual Security Testing
```bash
# Test webhook without signature (should fail)
curl -X POST http://localhost:3000/api/webhooks/admin/products \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  -v

# Expected: 401 Unauthorized

# Test with invalid signature (should fail)
curl -X POST http://localhost:3000/api/webhooks/admin/products \
  -H "Content-Type: application/json" \
  -H "x-signature: sha256=invalid" \
  -d '{"test": "data"}' \
  -v

# Expected: 401 Unauthorized
```

### 2. Valid Signature Test
```javascript
// scripts/test-webhook-signature.js
const crypto = require('crypto');

function generateValidSignature(payload, secret, timestamp) {
  const data = timestamp ? `${timestamp}.${payload}` : payload;
  return 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

// Test valid webhook
const payload = JSON.stringify({ test: 'data' });
const secret = 'your_test_secret';
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = generateValidSignature(payload, secret, timestamp);

console.log('Test webhook with:');
console.log('Payload:', payload);
console.log('Signature:', signature);
console.log('Timestamp:', timestamp);

// Use these values in curl request
```

### 3. Automated Security Tests
```typescript
// tests/webhook-security.test.ts
import { verifySignature } from '../src/app/api/webhooks/admin/products/route';

describe('Webhook Security', () => {
  const secret = 'test_secret_32_characters_long';
  const payload = '{"test": "data"}';
  
  test('should accept valid signature', () => {
    const validSignature = generateSignature(payload, secret);
    expect(verifySignature(payload, validSignature, secret)).toBe(true);
  });
  
  test('should reject invalid signature', () => {
    const invalidSignature = 'sha256=invalid';
    expect(verifySignature(payload, invalidSignature, secret)).toBe(false);
  });
  
  test('should reject old timestamps', () => {
    const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString();
    const signature = generateSignature(payload, secret, oldTimestamp);
    expect(verifySignature(payload, signature, secret, oldTimestamp)).toBe(false);
  });
  
  test('should reject empty signature', () => {
    expect(verifySignature(payload, '', secret)).toBe(false);
  });
});
```

---

## 🛡️ Security Best Practices Implementation

### 1. Defense in Depth
```typescript
// Multiple layers of security
export async function POST(request: NextRequest) {
  // Layer 1: Rate limiting
  if (!rateLimitWebhook(getClientIP(request))) {
    return new NextResponse('Rate limited', { status: 429 });
  }
  
  // Layer 2: Request validation
  const validation = validateWebhookRequest(request);
  if (!validation.isValid) {
    return new NextResponse(validation.error, { status: 400 });
  }
  
  // Layer 3: Signature verification
  const rawBody = await request.text();
  const signature = request.headers.get('x-signature');
  
  if (!verifySignature(rawBody, signature, webhookSecret)) {
    logSecurityEvent({
      type: 'signature_failure',
      clientIP: getClientIP(request),
      timestamp: new Date().toISOString(),
      details: { signature, bodyLength: rawBody.length }
    });
    return new NextResponse('Unauthorized', { status: 401 });
  }
  
  // Layer 4: Input sanitization
  const body = JSON.parse(rawBody);
  const sanitizedBody = sanitizeInput(body);
  
  // Process webhook safely
  return await processWebhook(sanitizedBody);
}
```

### 2. Secure Configuration
```typescript
// src/lib/config/webhook-config.ts
export const webhookConfig = {
  maxPayloadSize: 1048576, // 1MB
  signatureAlgorithm: 'sha256',
  timestampTolerance: 300, // 5 minutes
  rateLimit: {
    maxRequests: 10,
    windowMs: 60000 // 1 minute
  },
  allowedUserAgents: [
    'Stripe/',
    'GitHub-Hookshot/',
    // Add your trusted sources
  ]
};

// Validate configuration on startup
function validateWebhookConfig() {
  if (!process.env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET.length < 32) {
    throw new Error('WEBHOOK_SECRET must be at least 32 characters long');
  }
  
  if (!process.env.ADMIN_WEBHOOK_SECRET || process.env.ADMIN_WEBHOOK_SECRET.length < 32) {
    throw new Error('ADMIN_WEBHOOK_SECRET must be at least 32 characters long');
  }
}

validateWebhookConfig();
```

---

## 📊 Security Monitoring

### 1. Metrics to Track
```typescript
// Webhook security metrics
interface WebhookMetrics {
  totalRequests: number;
  validSignatures: number;
  invalidSignatures: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  uniqueClientIPs: Set<string>;
}

// Track in your monitoring system
export function trackWebhookMetrics(event: string, metadata: any) {
  // Send to your analytics/monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: DataDog, New Relic, custom monitoring
  }
}
```

### 2. Alert Conditions
```typescript
// Alert on suspicious activity
const ALERT_THRESHOLDS = {
  invalidSignaturesPerMinute: 5,
  rateLimitHitsPerMinute: 10,
  uniqueFailedIPsPerHour: 3
};

function checkForSuspiciousActivity(metrics: WebhookMetrics) {
  if (metrics.invalidSignatures > ALERT_THRESHOLDS.invalidSignaturesPerMinute) {
    sendSecurityAlert('High rate of invalid webhook signatures detected');
  }
}
```

---

## ✅ Success Criteria

### Immediate (After Implementation)
- [ ] Webhook signature verification properly implemented
- [ ] "return true" security bypass removed
- [ ] Environment variables configured with strong secrets
- [ ] Rate limiting active
- [ ] Security logging in place

### Security (After 1 week)
- [ ] No unauthorized webhook access detected
- [ ] Security monitoring alerts functioning
- [ ] Performance impact minimal (<10ms overhead)
- [ ] Team trained on webhook security

### Compliance (Ongoing)
- [ ] Webhook security passes audit requirements
- [ ] Documentation up to date
- [ ] Security tests passing in CI/CD
- [ ] Incident response procedures documented

---

## 🚨 Emergency Response Plan

### If Webhook Compromise Detected
1. **Immediate Actions (5 minutes)**
   - Rotate webhook secrets immediately
   - Deploy new secrets to production
   - Monitor for continued unauthorized access

2. **Assessment (15 minutes)**
   - Review webhook logs for unauthorized activity
   - Check for data modifications or theft
   - Identify source of compromise

3. **Containment (30 minutes)**
   - Block suspicious IP addresses
   - Increase rate limiting temporarily
   - Notify security team and stakeholders

---

## 📝 Documentation Updates Required

1. **Security Guidelines**
   - Webhook security requirements
   - Secret rotation procedures
   - Incident response playbook

2. **Development Guidelines**
   - Webhook implementation standards
   - Security testing requirements
   - Code review checklist

3. **CLAUDE.md Updates**
   - Add webhook security to security checklist
   - Document lessons learned
   - Include monitoring requirements

---

## 🔗 Related Security Issues

1. **API Key Exposure** - Related authentication concerns
2. **CSRF Protection** - Previous implementation failures
3. **Rate Limiting** - Comprehensive DoS protection
4. **Input Validation** - Prevent injection attacks

---

**Priority:** 🔴 CRITICAL - Active security vulnerability  
**Dependencies:** Environment variable configuration  
**Estimated Timeline:** 1 hour total (15 minutes minimum for basic fix)  
**Risk if Delayed:** Active security vulnerability allowing unauthorized access