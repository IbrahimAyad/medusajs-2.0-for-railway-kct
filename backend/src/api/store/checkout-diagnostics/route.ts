/**
 * Comprehensive Checkout Diagnostics
 * Combines all diagnostic checks into one endpoint
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

export const AUTHENTICATE = false

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { cart_id } = req.body as { cart_id?: string }
    
    // 1. Check Stripe Configuration
    const stripeKey = process.env.STRIPE_API_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    let stripeStatus = {
      configured: false,
      api_key_type: null as string | null,
      can_connect: false,
      can_create_payment_intent: false,
      error: null as any
    }
    
    if (stripeKey) {
      stripeStatus.configured = true
      stripeStatus.api_key_type = stripeKey.startsWith('sk_test') ? 'test' : 
                                   stripeKey.startsWith('sk_live') ? 'live' : 'unknown'
      
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2025-08-27.acacia' as any
        })
        
        // Test connection
        const account = await stripe.accounts.retrieve()
        stripeStatus.can_connect = true
        
        // Test payment intent creation
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 5000,
          currency: 'usd',
          metadata: { test: 'true' }
        })
        stripeStatus.can_create_payment_intent = true
        
        // Cancel test payment intent
        await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {})
        
      } catch (error: any) {
        stripeStatus.error = {
          message: error.message,
          type: error.type
        }
      }
    }
    
    // 2. Check Payment Providers
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
    let providers = []
    
    try {
      const providerList = await paymentModuleService.listPaymentProviders()
      providers = providerList.map(p => ({
        id: p.id,
        is_enabled: p.is_enabled
      }))
    } catch (error: any) {
      console.error("Failed to list providers:", error)
    }
    
    // 3. Check Cart (if provided)
    let cartStatus = null
    let paymentSessionTest = null
    
    if (cart_id) {
      const cartModuleService = req.scope.resolve(Modules.CART)
      
      try {
        const cart = await cartModuleService.retrieveCart(cart_id, {
          relations: [
            'shipping_address',
            'billing_address', 
            'items',
            'shipping_methods'
          ]
        })
        
        cartStatus = {
          id: cart.id,
          email: cart.email,
          total: Number(cart.total),
          currency: cart.currency_code,
          has_email: !!cart.email,
          has_shipping_address: !!cart.shipping_address,
          has_billing_address: !!cart.billing_address,
          has_shipping_method: cart.shipping_methods?.length > 0,
          items_count: cart.items?.length || 0,
          missing_requirements: []
        }
        
        // Check missing requirements
        if (!cart.email) cartStatus.missing_requirements.push("email")
        if (!cart.shipping_address) cartStatus.missing_requirements.push("shipping_address")
        if (!cart.billing_address) cartStatus.missing_requirements.push("billing_address")
        if (!cart.shipping_methods?.length) cartStatus.missing_requirements.push("shipping_method")
        if (Number(cart.total) < 50) cartStatus.missing_requirements.push("total_too_low")
        
        // Try to create payment session if cart is ready
        if (cartStatus.missing_requirements.length === 0) {
          try {
            // Create payment collection
            const collection = await paymentModuleService.createPaymentCollections({
              currency_code: cart.currency_code || 'usd',
              amount: Number(cart.total),
              metadata: { cart_id: cart.id }
            })
            
            // Try each provider
            const providerTests = []
            
            for (const provider of providers) {
              if (provider.is_enabled) {
                try {
                  const session = await paymentModuleService.createPaymentSession(
                    collection.id,
                    {
                      provider_id: provider.id,
                      currency_code: cart.currency_code || 'usd',
                      amount: Number(cart.total)
                    }
                  )
                  
                  providerTests.push({
                    provider_id: provider.id,
                    success: true,
                    session_id: session.id
                  })
                } catch (error: any) {
                  providerTests.push({
                    provider_id: provider.id,
                    success: false,
                    error: error.message
                  })
                }
              }
            }
            
            paymentSessionTest = {
              collection_id: collection.id,
              provider_tests: providerTests
            }
            
            // Clean up test collection
            try {
              await paymentModuleService.deletePaymentCollections(collection.id)
            } catch (e) {}
            
          } catch (error: any) {
            paymentSessionTest = {
              error: error.message
            }
          }
        }
        
      } catch (error: any) {
        cartStatus = {
          error: error.message
        }
      }
    }
    
    // 4. Generate Summary and Recommendations
    const summary = {
      stripe: {
        status: stripeStatus.can_create_payment_intent ? "✅ Working" : 
                stripeStatus.can_connect ? "⚠️ Connected but can't create payments" :
                stripeStatus.configured ? "❌ Configured but not connecting" :
                "❌ Not configured",
        details: stripeStatus
      },
      providers: {
        status: providers.length > 0 ? "✅ Found providers" : "❌ No providers",
        list: providers,
        stripe_provider: providers.find(p => p.id.includes('stripe'))
      },
      cart: cartStatus ? {
        status: cartStatus.missing_requirements?.length === 0 ? "✅ Ready" : "⚠️ Missing requirements",
        details: cartStatus
      } : null,
      payment_sessions: paymentSessionTest,
      recommendations: []
    }
    
    // Add recommendations
    if (!stripeStatus.configured) {
      summary.recommendations.push("Set STRIPE_API_KEY environment variable")
    }
    if (!stripeWebhookSecret) {
      summary.recommendations.push("Set STRIPE_WEBHOOK_SECRET environment variable")
    }
    if (cartStatus?.missing_requirements?.length > 0) {
      summary.recommendations.push(`Cart needs: ${cartStatus.missing_requirements.join(', ')}`)
    }
    if (paymentSessionTest?.provider_tests?.every(t => !t.success)) {
      summary.recommendations.push("No payment providers are working - check configuration")
    }
    
    res.json(summary)
    
  } catch (error: any) {
    console.error("[Checkout Diagnostics] Error:", error)
    res.status(500).json({
      error: "Failed to run diagnostics",
      message: error.message
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  // Simple version without cart
  return POST(Object.assign(req, { body: {} }), res)
}