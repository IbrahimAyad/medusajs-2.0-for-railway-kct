import { NextRequest, NextResponse } from 'next/server'
import { medusa } from '@/lib/medusa/client'

export async function POST(request: NextRequest) {
  try {
    const { cartId, customerInfo, shippingAddress, billingAddress } = await request.json()
    
    if (!cartId) {
      return NextResponse.json({ 
        error: 'Cart ID is required' 
      }, { status: 400 })
    }

    // Step 1: Update cart with customer information
    let updatedCart
    if (customerInfo?.email) {
      const cartUpdateResponse = await medusa.store.cart.update(cartId, {
        email: customerInfo.email,
        ...(shippingAddress && { shipping_address: shippingAddress }),
        ...(billingAddress && { billing_address: billingAddress })
      })
      updatedCart = cartUpdateResponse.cart
    }

    // Step 2: Get shipping options if address provided
    let shippingOptions = []
    if (shippingAddress) {
      try {
        shippingOptions = await medusa.store.shipping.listCartOptions(cartId)
        
        // Automatically select first shipping option
        if (shippingOptions.length > 0) {
          await medusa.store.cart.addShippingMethod(cartId, {
            option_id: shippingOptions[0].id,
          })
        }
      } catch (shippingError) {
        console.warn('Failed to set shipping options:', shippingError)
      }
    }

    // Step 3: Get available payment providers
    const providers = await medusa.store.payment.listPaymentProviders()
    const hasStripe = providers.some((p: any) => p.id === 'pp_stripe_stripe' && p.is_enabled)
    
    if (!hasStripe) {
      return NextResponse.json({ 
        error: 'Stripe payment provider is not available or enabled',
        providers: providers.map((p: any) => p.id)
      }, { status: 400 })
    }

    // Step 4: Initialize payment session with Stripe
    const paymentCollection = await medusa.store.payment.initiatePaymentSession(
      cartId,
      {
        provider_id: 'pp_stripe_stripe'
      }
    )

    // Step 5: Extract client secret
    const stripeSession = paymentCollection.payment_sessions?.find(
      (session: any) => session.provider_id === 'pp_stripe_stripe'
    )

    if (!stripeSession?.data?.client_secret) {
      return NextResponse.json({ 
        error: 'Failed to initialize Stripe payment session - no client secret received',
        paymentCollection
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cartId,
      clientSecret: stripeSession.data.client_secret,
      paymentSessionId: stripeSession.id,
      shippingOptions,
      providers: providers.map((p: any) => ({ id: p.id, is_enabled: p.is_enabled })),
      cart: updatedCart
    })

  } catch (error) {
    console.error('Medusa Stripe checkout API error:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to initialize Stripe checkout',
      success: false 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cartId = searchParams.get('cartId')
  
  if (!cartId) {
    return NextResponse.json({ 
      error: 'Cart ID is required' 
    }, { status: 400 })
  }

  try {
    // Get cart details
    const { cart } = await medusa.store.cart.retrieve(cartId)
    
    // Get available payment providers
    const providers = await medusa.store.payment.listPaymentProviders()
    
    return NextResponse.json({
      success: true,
      cart,
      providers: providers.map((p: any) => ({ 
        id: p.id, 
        is_enabled: p.is_enabled 
      }))
    })
  } catch (error) {
    console.error('Get cart API error:', error)
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to get cart details',
      success: false 
    }, { status: 500 })
  }
}