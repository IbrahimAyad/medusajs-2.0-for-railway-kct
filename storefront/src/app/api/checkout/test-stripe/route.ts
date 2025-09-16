import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  
  // Get all environment variable keys (not values for security)
  const envKeys = Object.keys(process.env)
  const stripeRelatedKeys = envKeys.filter(k => 
    k.includes('STRIPE') || 
    k.includes('NEXT_PUBLIC') ||
    k === 'NODE_ENV'
  )
  
  return NextResponse.json({
    environment: process.env.NODE_ENV || 'not set',
    timestamp: new Date().toISOString(),
    stripe_key_status: {
      exists: !!stripeKey,
      prefix: stripeKey ? stripeKey.substring(0, 7) : 'NOT SET',
      length: stripeKey ? stripeKey.length : 0,
      isTestKey: stripeKey ? stripeKey.startsWith('sk_test') : null,
      isLiveKey: stripeKey ? stripeKey.startsWith('sk_live') : null,
    },
    available_env_vars: stripeRelatedKeys,
    publishable_key_status: {
      exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20) || 'NOT SET'
    },
    backend_url: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'NOT SET',
    deployment_info: {
      railway: !!process.env.RAILWAY_ENVIRONMENT,
      vercel: !!process.env.VERCEL,
      platform: process.env.RAILWAY_ENVIRONMENT ? 'Railway' : process.env.VERCEL ? 'Vercel' : 'Local/Other'
    }
  })
}