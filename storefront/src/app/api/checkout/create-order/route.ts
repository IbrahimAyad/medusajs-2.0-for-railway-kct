import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import medusaClient from '@/lib/medusa-client'

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
}) : null

export async function POST(req: NextRequest) {
  try {
    const { cart_id } = await req.json()
    
    if (!cart_id) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      )
    }

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    console.log('Creating order-first flow for cart:', cart_id)

    // Step 1: Retrieve the cart to get details
    let cart
    try {
      const cartResponse = await medusaClient.carts.retrieve(cart_id)
      cart = cartResponse.cart
      console.log('Retrieved cart:', cart.id)
    } catch (error) {
      console.error('Failed to retrieve cart:', error)
      return NextResponse.json(
        { error: 'Cart not found or invalid' },
        { status: 404 }
      )
    }

    // Step 2: Create order with "pending_payment" status in Medusa first
    // This ensures the order exists BEFORE payment
    let order
    try {
      // Complete the cart to create the order, but it will be in pending state until payment
      const orderResponse = await medusaClient.carts.complete(cart_id)
      
      if (orderResponse.type === 'order') {
        order = orderResponse.data
        console.log('✅ Order created successfully:', order.id)
      } else {
        // If cart completion returns cart with payment session, we'll handle payment separately
        console.log('Cart completion returned payment session, will create order after payment')
        
        // For now, we'll treat this as a pending order scenario
        // In a production environment, you might want to create a "draft order" concept
        order = {
          id: `pending_${cart_id}`,
          status: 'pending_payment',
          cart_id: cart_id
        }
      }
    } catch (error) {
      console.error('Failed to create order in Medusa:', error)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Step 3: Create Stripe Payment Intent WITH order_id (not cart_id) in metadata
    let paymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: cart.total, // Amount in cents
        currency: 'usd',
        metadata: {
          order_id: order.id,           // Key change: track by order_id
          cart_id: cart_id,            // Keep cart_id for backward compatibility  
          customer_email: cart.email || '',
          order_status: 'pending_payment'
        },
        description: `Order ${order.id} - KCT Menswear`
      })
      
      console.log('✅ Payment Intent created:', paymentIntent.id, 'for order:', order.id)
    } catch (error) {
      console.error('Failed to create Stripe payment intent:', error)
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      )
    }

    // Step 4: Return order_id and client_secret to frontend
    return NextResponse.json({
      success: true,
      order_id: order.id,
      cart_id: cart_id,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: cart.total,
      status: 'pending_payment'
    })

  } catch (error) {
    console.error('Create order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}