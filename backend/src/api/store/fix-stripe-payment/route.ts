/**
 * Fix Stripe Payment Session
 * Ensures cart has all required data for Stripe
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { cart_id } = req.body as { cart_id?: string }
    
    if (!cart_id) {
      return res.status(400).json({
        error: "cart_id is required"
      })
    }
    
    const cartModuleService = req.scope.resolve(Modules.CART)
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
    
    // Get the cart
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: ['shipping_address', 'billing_address', 'items']
    })
    
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      })
    }
    
    // Check what's missing for Stripe
    const issues = []
    
    if (!cart.email) {
      issues.push("Missing customer email")
    }
    
    if (!cart.shipping_address) {
      issues.push("Missing shipping address")
    }
    
    if (!cart.billing_address) {
      issues.push("Missing billing address")
    }
    
    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      issues.push("Missing shipping method")
    }
    
    if (Number(cart.total) < 50) { // Stripe minimum in cents
      issues.push(`Total too low: ${cart.total} (minimum 50 cents)`)
    }
    
    // Try to create a payment collection
    let paymentCollection = null
    let paymentSession = null
    let stripeError = null
    
    try {
      // Create payment collection
      const collection = await paymentModuleService.createPaymentCollections({
        currency_code: cart.currency_code,
        amount: cart.total,
        metadata: {
          cart_id: cart.id
        }
      })
      
      paymentCollection = collection
      
      // Try to create Stripe session
      try {
        const session = await paymentModuleService.createPaymentSession(
          collection.id,
          {
            provider_id: 'pp_stripe_stripe',
            currency_code: cart.currency_code,
            amount: cart.total,
            context: {},
            data: {
              customer_email: cart.email || 'test@example.com'
            }
          }
        )
        
        paymentSession = session
        
      } catch (sessionError: any) {
        stripeError = {
          message: sessionError.message,
          type: sessionError.type || 'session_creation_failed',
          code: sessionError.code
        }
      }
      
    } catch (collectionError: any) {
      stripeError = {
        message: collectionError.message,
        type: 'collection_creation_failed'
      }
    }
    
    res.json({
      cart_status: {
        id: cart.id,
        email: cart.email,
        total: cart.total,
        currency: cart.currency_code,
        has_shipping_address: !!cart.shipping_address,
        has_billing_address: !!cart.billing_address,
        has_shipping_method: cart.shipping_methods?.length > 0,
        items_count: cart.items?.length || 0
      },
      issues,
      requirements_met: issues.length === 0,
      payment_test: {
        collection_created: !!paymentCollection,
        collection_id: paymentCollection?.id,
        stripe_session_created: !!paymentSession,
        stripe_error: stripeError
      },
      fix_instructions: issues.length > 0 ? {
        message: "Cart is missing required data for Stripe",
        required_fixes: issues,
        solution: "Ensure cart has email, shipping address, billing address, and shipping method before creating payment session"
      } : {
        message: "Cart meets all requirements",
        next_step: "Try creating payment session again"
      }
    })
    
  } catch (error: any) {
    console.error("[Fix Stripe Payment] Error:", error)
    res.status(500).json({
      error: "Failed to diagnose Stripe payment issue",
      message: error.message
    })
  }
}