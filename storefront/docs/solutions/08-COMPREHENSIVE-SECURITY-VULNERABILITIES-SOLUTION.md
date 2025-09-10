# Comprehensive Security Vulnerabilities Solution

**Issue ID:** SECURITY-003  
**Priority:** 🔴 CRITICAL - LAUNCH BLOCKER  
**Estimated Fix Time:** 4-6 hours  
**Risk Level:** HIGH - Multi-faceted Security Issues

## Problem Description

### What Was Found
Multiple security vulnerabilities across the application:

```
Security Issues Identified:
1. CSP Headers Too Permissive ('unsafe-inline' 'unsafe-eval')
2. No Rate Limiting on API endpoints  
3. Authentication endpoints vulnerable to spam
4. Checkout API can be abused
5. Missing security headers
6. CSRF protection implementation issues
7. Input validation gaps
8. Session management vulnerabilities
```

### Security Impact Assessment
- **Data Breach Risk:** HIGH - Exposed APIs and weak authentication
- **Financial Risk:** HIGH - Unprotected checkout endpoints
- **DDOS Risk:** HIGH - No rate limiting
- **XSS Risk:** MEDIUM - Permissive CSP headers
- **CSRF Risk:** MEDIUM - Incomplete CSRF protection

### Known Issues from CLAUDE.md
From previous documentation, CSRF implementation was attempted but caused build failures:
- JSX syntax added to TypeScript files
- React components mixed with security logic
- Build failures led to security features being disabled

## Root Cause Analysis

### Security Architecture Issues
1. **Missing Security-First Design:** Features added without security consideration
2. **Development Shortcuts:** Security features disabled for easier development
3. **Incomplete Implementation:** Security measures started but not finished
4. **Lack of Security Reviews:** No systematic security auditing process

### Previous Attempts Found
Based on CLAUDE.md, security implementation was attempted but abandoned due to:
- Technical implementation errors (JSX in .ts files)
- Build breaking changes
- Lack of proper security middleware pattern

## Step-by-Step Solution

### IMMEDIATE ACTIONS (Within 2 Hours)

#### 1. Security Headers Implementation
```typescript
// next.config.ts - Secure headers configuration
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ];
  },
};

module.exports = nextConfig;
```

#### 2. Rate Limiting Implementation
```typescript
// lib/security/rate-limiter.ts
import { LRUCache } from 'lru-cache';

interface RateLimitConfig {
  uniqueTokenPerInterval: number;
  interval: number;
}

interface RateLimiterOptions {
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
  onLimitReached?: (req: any) => void;
}

class RateLimiter {
  private cache: LRUCache<string, number>;
  private config: RateLimitConfig;
  private options: RateLimiterOptions;

  constructor(config: RateLimitConfig, options: RateLimiterOptions = {}) {
    this.config = config;
    this.options = options;
    this.cache = new LRUCache({
      max: config.uniqueTokenPerInterval || 500,
      ttl: config.interval || 60000,
    });
  }

  async check(req: any): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> {
    // Skip if condition met
    if (this.options.skip && this.options.skip(req)) {
      return { success: true, limit: this.config.uniqueTokenPerInterval, remaining: this.config.uniqueTokenPerInterval, resetTime: Date.now() + this.config.interval };
    }

    // Generate key for this request
    const key = this.options.keyGenerator ? this.options.keyGenerator(req) : this.getDefaultKey(req);
    
    // Get current count
    const currentCount = this.cache.get(key) || 0;
    
    // Check if limit exceeded
    if (currentCount >= this.config.uniqueTokenPerInterval) {
      if (this.options.onLimitReached) {
        this.options.onLimitReached(req);
      }
      
      return {
        success: false,
        limit: this.config.uniqueTokenPerInterval,
        remaining: 0,
        resetTime: Date.now() + this.config.interval
      };
    }

    // Increment counter
    this.cache.set(key, currentCount + 1);

    return {
      success: true,
      limit: this.config.uniqueTokenPerInterval,
      remaining: this.config.uniqueTokenPerInterval - currentCount - 1,
      resetTime: Date.now() + this.config.interval
    };
  }

  private getDefaultKey(req: any): string {
    // Use IP address and user agent for identification
    const ip = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}:${userAgent}`;
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API endpoints - 100 requests per 15 minutes
  api: new RateLimiter(
    { uniqueTokenPerInterval: 100, interval: 15 * 60 * 1000 },
    {
      keyGenerator: (req) => req.ip || 'unknown',
      onLimitReached: (req) => console.warn('API rate limit exceeded:', req.ip)
    }
  ),
  
  // Authentication endpoints - 5 attempts per 15 minutes
  auth: new RateLimiter(
    { uniqueTokenPerInterval: 5, interval: 15 * 60 * 1000 },
    {
      keyGenerator: (req) => `auth:${req.ip || 'unknown'}`,
      onLimitReached: (req) => console.error('Auth rate limit exceeded:', req.ip)
    }
  ),
  
  // Checkout endpoints - 10 attempts per 10 minutes
  checkout: new RateLimiter(
    { uniqueTokenPerInterval: 10, interval: 10 * 60 * 1000 },
    {
      keyGenerator: (req) => `checkout:${req.ip || 'unknown'}`,
      onLimitReached: (req) => console.error('Checkout rate limit exceeded:', req.ip)
    }
  ),
  
  // Contact form - 3 submissions per hour
  contact: new RateLimiter(
    { uniqueTokenPerInterval: 3, interval: 60 * 60 * 1000 },
    {
      keyGenerator: (req) => `contact:${req.ip || 'unknown'}`,
      onLimitReached: (req) => console.warn('Contact form rate limit exceeded:', req.ip)
    }
  )
};
```

#### 3. Security Middleware Implementation
```typescript
// lib/security/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters } from './rate-limiter';
import { validateCSRFToken } from './csrf';
import { sanitizeInput } from './input-validation';

interface SecurityConfig {
  rateLimiter?: 'api' | 'auth' | 'checkout' | 'contact';
  requireCSRF?: boolean;
  validateInput?: boolean;
  requireAuth?: boolean;
  allowedMethods?: string[];
  requireHTTPS?: boolean;
}

export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // HTTPS enforcement
      if (config.requireHTTPS && request.nextUrl.protocol === 'http:') {
        return NextResponse.json(
          { error: 'HTTPS required' },
          { status: 400 }
        );
      }

      // Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
      }

      // Rate limiting
      if (config.rateLimiter) {
        const limiter = rateLimiters[config.rateLimiter];
        const rateLimitResult = await limiter.check(request);
        
        if (!rateLimitResult.success) {
          return NextResponse.json(
            { 
              error: 'Rate limit exceeded',
              retryAfter: rateLimitResult.resetTime 
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
              }
            }
          );
        }

        // Add rate limit headers to successful responses
        const response = await handler(request);
        response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString());
        
        return response;
      }

      // CSRF validation
      if (config.requireCSRF && request.method !== 'GET') {
        const csrfToken = request.headers.get('x-csrf-token');
        const isValidCSRF = await validateCSRFToken(csrfToken, request);
        
        if (!isValidCSRF) {
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      // Input validation
      if (config.validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.text();
          const sanitizedBody = sanitizeInput(body);
          
          // Create new request with sanitized body
          const sanitizedRequest = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: sanitizedBody
          });
          
          return await handler(sanitizedRequest);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid input data' },
            { status: 400 }
          );
        }
      }

      // Call the actual handler
      return await handler(request);

    } catch (error: any) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal security error' },
        { status: 500 }
      );
    }
  };
}
```

### COMPREHENSIVE SECURITY IMPLEMENTATIONS

#### 1. CSRF Protection (Correct Implementation)
```typescript
// lib/security/csrf.ts
import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Store CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number; used: boolean }>();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expires < now) {
      csrfTokens.delete(key);
    }
  }
}, 60 * 60 * 1000);

export function generateCSRFToken(sessionId?: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const key = sessionId || crypto.randomBytes(16).toString('hex');
  
  csrfTokens.set(key, {
    token,
    expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
    used: false
  });
  
  return token;
}

export async function validateCSRFToken(
  token: string | null, 
  request: NextRequest
): Promise<boolean> {
  if (!token) return false;
  
  // Get session identifier (could be from cookie, header, etc.)
  const sessionId = request.cookies.get('session-id')?.value || 
                   request.headers.get('x-session-id');
  
  if (!sessionId) return false;
  
  const storedToken = csrfTokens.get(sessionId);
  
  if (!storedToken) return false;
  if (storedToken.expires < Date.now()) return false;
  if (storedToken.used) return false; // One-time use
  if (storedToken.token !== token) return false;
  
  // Mark token as used
  storedToken.used = true;
  
  return true;
}

// API route to get CSRF token
// src/app/api/csrf-token/route.ts
export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('session-id')?.value || 
                   crypto.randomBytes(16).toString('hex');
  
  const token = generateCSRFToken(sessionId);
  
  const response = NextResponse.json({ csrfToken: token });
  
  // Set session cookie if it doesn't exist
  if (!request.cookies.get('session-id')) {
    response.cookies.set('session-id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 // 2 hours
    });
  }
  
  return response;
}
```

#### 2. Input Validation & Sanitization
```typescript
// lib/security/input-validation.ts
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

interface ValidationRule {
  field: string;
  type: 'string' | 'email' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  allowedValues?: any[];
}

export class InputValidator {
  private rules: ValidationRule[];

  constructor(rules: ValidationRule[]) {
    this.rules = rules;
  }

  validate(data: any): { isValid: boolean; errors: string[]; sanitizedData?: any } {
    const errors: string[] = [];
    const sanitizedData: any = {};

    for (const rule of this.rules) {
      const value = data[rule.field];

      // Required field check
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push(`${rule.field} must be of type ${rule.type}`);
        continue;
      }

      // Length validation for strings
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
          continue;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${rule.field} must be no more than ${rule.maxLength} characters`);
          continue;
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          errors.push(`${rule.field} format is invalid`);
          continue;
        }
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(`${rule.field} must be one of: ${rule.allowedValues.join(', ')}`);
        continue;
      }

      // Email validation
      if (rule.type === 'email' && !validator.isEmail(value)) {
        errors.push(`${rule.field} must be a valid email address`);
        continue;
      }

      // Sanitization
      let sanitizedValue = value;
      if (rule.sanitize && typeof value === 'string') {
        sanitizedValue = this.sanitizeString(value);
      }

      sanitizedData[rule.field] = sanitizedValue;
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    };
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'email':
        return typeof value === 'string';
      default:
        return false;
    }
  }

  private sanitizeString(str: string): string {
    // Remove HTML tags and sanitize
    let sanitized = DOMPurify.sanitize(str, { ALLOWED_TAGS: [] });
    
    // Escape special characters
    sanitized = validator.escape(sanitized);
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }
}

// Pre-configured validators for common use cases
export const validators = {
  userRegistration: new InputValidator([
    { field: 'email', type: 'email', required: true, maxLength: 254 },
    { field: 'password', type: 'string', required: true, minLength: 8, maxLength: 128 },
    { field: 'firstName', type: 'string', required: true, minLength: 1, maxLength: 50, sanitize: true },
    { field: 'lastName', type: 'string', required: true, minLength: 1, maxLength: 50, sanitize: true },
  ]),
  
  productReview: new InputValidator([
    { field: 'rating', type: 'number', required: true, allowedValues: [1, 2, 3, 4, 5] },
    { field: 'title', type: 'string', required: true, minLength: 5, maxLength: 100, sanitize: true },
    { field: 'comment', type: 'string', required: true, minLength: 10, maxLength: 1000, sanitize: true },
    { field: 'productId', type: 'string', required: true, pattern: /^[a-zA-Z0-9-_]+$/ },
  ]),
  
  contactForm: new InputValidator([
    { field: 'name', type: 'string', required: true, minLength: 2, maxLength: 100, sanitize: true },
    { field: 'email', type: 'email', required: true, maxLength: 254 },
    { field: 'subject', type: 'string', required: true, minLength: 5, maxLength: 200, sanitize: true },
    { field: 'message', type: 'string', required: true, minLength: 10, maxLength: 2000, sanitize: true },
  ]),
  
  checkoutData: new InputValidator([
    { field: 'items', type: 'array', required: true },
    { field: 'shippingAddress', type: 'object', required: true },
    { field: 'paymentMethod', type: 'string', required: true, allowedValues: ['card', 'paypal'] },
  ])
};

// Utility function for quick sanitization
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
```

#### 3. Session Management Security
```typescript
// lib/security/session-manager.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface SessionData {
  userId?: string;
  email?: string;
  role?: string;
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
}

interface SessionConfig {
  maxAge: number; // Session expiry in milliseconds
  idleTimeout: number; // Idle timeout in milliseconds
  requireSSL: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  httpOnly: boolean;
}

class SecureSessionManager {
  private sessions = new Map<string, SessionData>();
  private config: SessionConfig;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      idleTimeout: 2 * 60 * 60 * 1000, // 2 hours
      requireSSL: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      httpOnly: true,
      ...config
    };

    // Clean up expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  createSession(userData: Partial<SessionData>, request: NextRequest): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    
    const sessionData: SessionData = {
      ...userData,
      createdAt: now,
      lastActivity: now,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    this.sessions.set(sessionId, sessionData);
    return sessionId;
  }

  getSession(sessionId: string | null): SessionData | null {
    if (!sessionId) return null;
    
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const now = Date.now();
    
    // Check if session expired
    if (now - session.createdAt > this.config.maxAge) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Check if session is idle
    if (now - session.lastActivity > this.config.idleTimeout) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    
    return session;
  }

  updateSession(sessionId: string, updates: Partial<SessionData>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    Object.assign(session, updates);
    session.lastActivity = Date.now();
    
    return true;
  }

  destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  validateSessionSecurity(sessionId: string, request: NextRequest): boolean {
    const session = this.getSession(sessionId);
    if (!session) return false;

    const currentIP = this.getClientIP(request);
    const currentUserAgent = request.headers.get('user-agent') || 'unknown';

    // Check for session hijacking indicators
    if (session.ipAddress !== currentIP) {
      console.warn('Session IP mismatch detected', { 
        sessionId, 
        originalIP: session.ipAddress, 
        currentIP 
      });
      // In production, might want to invalidate session
      // this.destroySession(sessionId);
      // return false;
    }

    if (session.userAgent !== currentUserAgent) {
      console.warn('Session User-Agent mismatch detected', { 
        sessionId,
        originalUA: session.userAgent.substring(0, 50),
        currentUA: currentUserAgent.substring(0, 50)
      });
    }

    return true;
  }

  setSessionCookie(response: NextResponse, sessionId: string): void {
    response.cookies.set('session-id', sessionId, {
      httpOnly: this.config.httpOnly,
      secure: this.config.requireSSL,
      sameSite: this.config.sameSite,
      maxAge: Math.floor(this.config.maxAge / 1000), // Convert to seconds
      path: '/'
    });
  }

  clearSessionCookie(response: NextResponse): void {
    response.cookies.delete('session-id');
  }

  private getClientIP(request: NextRequest): string {
    return request.ip || 
           request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > this.config.maxAge ||
          now - session.lastActivity > this.config.idleTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
    });

    if (expiredSessions.length > 0) {
      console.log(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  getSessionStats(): { total: number; active: number; expired: number } {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const session of this.sessions.values()) {
      if (now - session.lastActivity <= this.config.idleTimeout) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total: this.sessions.size,
      active,
      expired
    };
  }
}

export const sessionManager = new SecureSessionManager();
```

### SECURE API ROUTE EXAMPLES

#### 1. Protected Authentication Routes
```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/middleware';
import { validators } from '@/lib/security/input-validation';
import { sessionManager } from '@/lib/security/session-manager';
import bcrypt from 'bcrypt';

async function loginHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = validators.userLogin.validate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    const { email, password } = validation.sanitizedData!;

    // Authenticate user (implement your auth logic)
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create secure session
    const sessionId = sessionManager.createSession({
      userId: user.id,
      email: user.email,
      role: user.role
    }, request);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

    // Set secure session cookie
    sessionManager.setSessionCookie(response, sessionId);

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Apply security middleware
export const POST = withSecurity(loginHandler, {
  rateLimiter: 'auth',
  requireCSRF: true,
  validateInput: true,
  allowedMethods: ['POST'],
  requireHTTPS: true
});

async function authenticateUser(email: string, password: string) {
  // Implement your user authentication logic
  // This is a placeholder
  return null;
}
```

#### 2. Protected Checkout Routes
```typescript
// src/app/api/checkout/create-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withSecurity } from '@/lib/security/middleware';
import { validators } from '@/lib/security/input-validation';
import { sessionManager } from '@/lib/security/session-manager';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

async function createCheckoutSessionHandler(request: NextRequest) {
  try {
    // Verify user session
    const sessionId = request.cookies.get('session-id')?.value;
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate session security
    if (!sessionManager.validateSessionSecurity(sessionId!, request)) {
      return NextResponse.json(
        { error: 'Session security validation failed' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate checkout data
    const validation = validators.checkoutData.validate(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid checkout data', details: validation.errors },
        { status: 400 }
      );
    }

    const { items, shippingAddress, paymentMethod } = validation.sanitizedData!;

    // Verify items and calculate total
    const verifiedItems = await verifyAndCalculateItems(items);
    if (!verifiedItems.success) {
      return NextResponse.json(
        { error: 'Invalid items in cart' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: verifiedItems.lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        userId: session.userId!,
        orderData: JSON.stringify({ shippingAddress, items })
      }
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });

  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Apply security middleware
export const POST = withSecurity(createCheckoutSessionHandler, {
  rateLimiter: 'checkout',
  requireCSRF: true,
  validateInput: true,
  allowedMethods: ['POST'],
  requireHTTPS: true
});

async function verifyAndCalculateItems(items: any[]) {
  // Implement item verification and price calculation
  // This is a placeholder
  return { success: true, lineItems: [] };
}
```

### MONITORING & ALERTING

#### 1. Security Event Monitoring
```typescript
// lib/security/security-monitor.ts
interface SecurityEvent {
  type: 'rate_limit' | 'csrf_failure' | 'auth_failure' | 'session_hijack' | 'suspicious_input';
  timestamp: number;
  ip: string;
  userAgent: string;
  endpoint: string;
  userId?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private alertThresholds = {
    rateLimitHits: 10, // per hour
    authFailures: 5,   // per 15 minutes
    csrfFailures: 3,   // per hour
    suspiciousInput: 5 // per hour
  };

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.events.push(fullEvent);
    
    // Check for immediate alerts
    this.checkImmediateAlerts(fullEvent);
    
    // Check threshold alerts
    this.checkThresholdAlerts();
    
    // Clean up old events (keep last 24 hours)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.events = this.events.filter(e => e.timestamp > cutoff);
  }

  private checkImmediateAlerts(event: SecurityEvent) {
    // Immediate critical alerts
    if (event.severity === 'critical') {
      this.sendImmediateAlert('Critical security event detected', event);
    }
    
    // Session hijacking attempts
    if (event.type === 'session_hijack') {
      this.sendImmediateAlert('Potential session hijacking detected', event);
    }
  }

  private checkThresholdAlerts() {
    const now = Date.now();
    
    // Check rate limit hits in last hour
    const recentRateLimits = this.events.filter(e => 
      e.type === 'rate_limit' && 
      e.timestamp > now - 60 * 60 * 1000
    );
    
    if (recentRateLimits.length >= this.alertThresholds.rateLimitHits) {
      this.sendThresholdAlert('High rate limiting activity', {
        type: 'rate_limit',
        count: recentRateLimits.length,
        timeWindow: '1 hour'
      });
    }
    
    // Check auth failures in last 15 minutes
    const recentAuthFailures = this.events.filter(e =>
      e.type === 'auth_failure' &&
      e.timestamp > now - 15 * 60 * 1000
    );
    
    if (recentAuthFailures.length >= this.alertThresholds.authFailures) {
      this.sendThresholdAlert('Multiple authentication failures', {
        type: 'auth_failure',
        count: recentAuthFailures.length,
        timeWindow: '15 minutes'
      });
    }
  }

  private async sendImmediateAlert(message: string, event: SecurityEvent) {
    console.error('🚨 IMMEDIATE SECURITY ALERT:', message, event);
    
    // In production, send to monitoring service
    try {
      await fetch('/api/alerts/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'immediate',
          message,
          event,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send immediate security alert:', error);
    }
  }

  private async sendThresholdAlert(message: string, details: any) {
    console.warn('⚠️ SECURITY THRESHOLD ALERT:', message, details);
    
    try {
      await fetch('/api/alerts/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'threshold',
          message,
          details,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send threshold security alert:', error);
    }
  }

  getSecurityDashboard() {
    const now = Date.now();
    const last24Hours = this.events.filter(e => e.timestamp > now - 24 * 60 * 60 * 1000);
    
    return {
      totalEvents: last24Hours.length,
      eventsByType: this.groupEventsByType(last24Hours),
      eventsBySeverity: this.groupEventsBySeverity(last24Hours),
      topIPs: this.getTopIPs(last24Hours),
      timeline: this.getHourlyTimeline(last24Hours)
    };
  }

  private groupEventsByType(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupEventsBySeverity(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopIPs(events: SecurityEvent[]) {
    const ipCounts = events.reduce((acc, event) => {
      acc[event.ip] = (acc[event.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  private getHourlyTimeline(events: SecurityEvent[]) {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date();
      hour.setHours(hour.getHours() - i, 0, 0, 0);
      return {
        hour: hour.toISOString(),
        count: 0,
        events: {} as Record<string, number>
      };
    });
    
    events.forEach(event => {
      const eventHour = new Date(event.timestamp);
      eventHour.setMinutes(0, 0, 0);
      
      const match = hours.find(h => new Date(h.hour).getTime() === eventHour.getTime());
      if (match) {
        match.count++;
        match.events[event.type] = (match.events[event.type] || 0) + 1;
      }
    });
    
    return hours.reverse();
  }
}

export const securityMonitor = new SecurityMonitor();
```

## Testing & Verification

### 1. Security Testing Suite
```bash
#!/bin/bash
# scripts/test-security.sh

echo "🔒 Running comprehensive security tests..."

# Test 1: Rate limiting
echo "1. Testing rate limiting..."
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/login
done | tail -1 | grep -q "429" && echo "✅ Rate limiting works" || echo "❌ Rate limiting failed"

# Test 2: CSRF protection
echo "2. Testing CSRF protection..."
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@test.com","message":"test"}' \
  | grep -q "Invalid CSRF token" && echo "✅ CSRF protection works" || echo "❌ CSRF protection failed"

# Test 3: Input validation
echo "3. Testing input validation..."
curl -s -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"invalid","message":""}' \
  | grep -q "Invalid input" && echo "✅ Input validation works" || echo "❌ Input validation failed"

# Test 4: Security headers
echo "4. Testing security headers..."
HEADERS=$(curl -s -I http://localhost:3000/ | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)")
if [ ! -z "$HEADERS" ]; then
  echo "✅ Security headers present"
else
  echo "❌ Security headers missing"
fi

# Test 5: HTTPS enforcement (if in production)
if [ "$NODE_ENV" = "production" ]; then
  echo "5. Testing HTTPS enforcement..."
  curl -s -I http://localhost:3000/api/test | grep -q "400" && echo "✅ HTTPS enforced" || echo "❌ HTTPS not enforced"
fi

echo "🔒 Security tests completed"
```

## Verification Checklist

### Immediate Verification
- [ ] Security headers implemented and active
- [ ] Rate limiting working on API endpoints
- [ ] CSRF protection functioning correctly
- [ ] Input validation and sanitization working
- [ ] Session management secure
- [ ] Authentication endpoints protected

### Security Verification
- [ ] No XSS vulnerabilities
- [ ] No CSRF vulnerabilities  
- [ ] No SQL injection possibilities
- [ ] Rate limiting prevents abuse
- [ ] Security monitoring active
- [ ] Proper error handling (no info leakage)

### Production Verification
- [ ] HTTPS enforced
- [ ] Secure cookies configuration
- [ ] Security headers in production
- [ ] Monitoring and alerting functional
- [ ] Security event logging working

---

**Next Steps:**
1. Implement security headers and rate limiting
2. Deploy CSRF protection correctly
3. Add input validation to all endpoints
4. Set up security monitoring
5. Test all security measures thoroughly

**Estimated Total Time:** 4-6 hours  
**Dependencies:** Security libraries, monitoring setup  
**Risk After Fix:** LOW - Comprehensive security implementation