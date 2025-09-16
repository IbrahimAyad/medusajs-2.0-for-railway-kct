import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe with secret key from environment
// IMPORTANT: Set STRIPE_SECRET_KEY in Railway environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY

// Enhanced logging for debugging
console.log('=== Stripe API Route Initialization ===')
console.log('Environment:', process.env.NODE_ENV)
console.log('STRIPE_SECRET_KEY exists:', !!stripeKey)
console.log('Key prefix:', stripeKey ? stripeKey.substring(0, 7) : 'NOT SET')
console.log('Key length:', stripeKey ? stripeKey.length : 0)

if (!stripeKey) {
  console.error('❌ CRITICAL: STRIPE_SECRET_KEY is not set in environment variables')
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE') || k.includes('NEXT_PUBLIC')))
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2024-04-10', // Use latest stable API version
  typescript: true,
}) : null

export async function POST(request: NextRequest) {
  console.log('=== Stripe Payment Intent Creation ===')
  console.log('Request method:', request.method)
  console.log('Request URL:', request.url)
  
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers })
  }
  
  try {
    if (!stripe) {
      console.error('❌ Stripe not initialized - missing secret key')
      return NextResponse.json(
        { 
          error: 'Payment system not configured. Please contact support.',
          debug: {
            hasKey: !!process.env.STRIPE_SECRET_KEY,
            keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
            env: process.env.NODE_ENV
          }
        },
        { status: 500, headers }
      )
    }

    const body = await request.json()
    const { amount, cartId, email } = body
    
    console.log('Request body:', { amount, cartId, email: email || 'not provided' })

    if (!amount || !cartId) {
      console.error('❌ Missing required fields:', { hasAmount: !!amount, hasCartId: !!cartId })
      return NextResponse.json(
        { error: 'Missing required fields', missing: { amount: !amount, cartId: !cartId } },
        { status: 400, headers }
      )
    }

    console.log('Creating payment intent with amount:', Math.round(amount))
    
    // Create a PaymentIntent with the correct API version
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure amount is an integer
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true, // Enable all payment methods
      },
      metadata: {
        cartId,
        email: email || '',
      },
      // Don't include any Amazon Pay or express checkout options
      // These cause the parameter_invalid_empty error
    })
    
    console.log('✅ Payment intent created successfully')
    console.log('Payment Intent ID:', paymentIntent.id)
    console.log('Client Secret format:', paymentIntent.client_secret?.substring(0, 20) + '...')
    console.log('Amount:', paymentIntent.amount)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      debug: {
        created: true,
        hasClientSecret: !!paymentIntent.client_secret,
        secretFormat: paymentIntent.client_secret?.split('_secret_')[0]
      }
    }, { headers })
  } catch (error: any) {
    console.error('❌ Stripe payment intent creation error:', error)
    console.error('Error type:', error.type)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    console.error('Full error:', JSON.stringify(error, null, 2))
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create payment intent',
        type: error.type,
        code: error.code,
        debug: {
          hasStripe: !!stripe,
          hasKey: !!process.env.STRIPE_SECRET_KEY,
          keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7)
        }
      },
      { status: 500, headers }
    )
  }
}

// Add OPTIONS handler
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function PUT(request: NextRequest) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  
  try {
    const body = await request.json()
    const { paymentIntentId, cartId } = body

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Missing payment intent ID' },
        { status: 400 }
      )
    }

    // Retrieve the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      // Payment successful, complete the order
      // You would typically call your backend here to complete the order
      
      return NextResponse.json({
        success: true,
        status: paymentIntent.status,
        orderId: cartId, // In production, create actual order
      }, { headers })
    }

    return NextResponse.json({
      success: false,
      status: paymentIntent.status,
      message: 'Payment not yet completed',
    }, { headers })
  } catch (error: any) {
    console.error('Stripe payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500, headers }
    )
  }
}