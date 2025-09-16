import { NextRequest, NextResponse } from 'next/server'

// This route now only returns the Stripe publishable key
// Payment intent creation is handled by the backend

export async function GET(request: NextRequest) {
  console.log('=== Stripe Publishable Key Request ===')
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  try {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      return NextResponse.json(
        { 
          error: 'Stripe configuration missing',
          debug: {
            hasKey: !!publishableKey
          }
        },
        { status: 500, headers }
      )
    }

    console.log('✅ Returning Stripe publishable key')

    return NextResponse.json({
      publishableKey
    }, { headers })
    
  } catch (error: any) {
    console.error('❌ Error getting publishable key:', error)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get Stripe configuration'
      },
      { status: 500, headers }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}