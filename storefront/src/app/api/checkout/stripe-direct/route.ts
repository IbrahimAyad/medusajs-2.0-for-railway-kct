import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { medusa } from '@/lib/medusa/client'

// Only initialize Stripe if we have a key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe is not configured - missing secret key')
      return NextResponse.json({ 
        error: 'Payment system not configured' 
      }, { status: 500 })
    }
    const { cartId, email } = await request.json()
    
    if (!cartId) {
      return NextResponse.json({ 
        error: 'Cart ID is required' 
      }, { status: 400 })
    }

    // Get cart from Medusa
    const { cart } = await medusa.store.cart.retrieve(cartId)
    
    if (!cart || !cart.items?.length) {
      return NextResponse.json({ 
        error: 'Cart is empty or not found' 
      }, { status: 400 })
    }

    // Update cart with email if provided
    if (email && email !== cart.email) {
      await medusa.store.cart.update(cartId, { email })
    }

    // Create line items for Stripe
    const lineItems = cart.items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: item.variant?.title ? `Size: ${item.variant.title}` : undefined,
          images: item.thumbnail ? [item.thumbnail] : [],
        },
        unit_amount: Math.round(item.unit_price * 100), // Convert to cents for Stripe
      },
      quantity: item.quantity,
    }))

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}&cart_id=${cartId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cart`,
      customer_email: email || cart.email,
      metadata: {
        cart_id: cartId,
        medusa_cart_id: cart.id,
      },
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
      billing_address_collection: 'required',
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'usd',
            },
            display_name: 'Free shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500,
              currency: 'usd',
            },
            display_name: 'Express shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 3,
              },
            },
          },
        },
      ],
    })

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Stripe direct checkout error:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
      success: false 
    }, { status: 500 })
  }
}