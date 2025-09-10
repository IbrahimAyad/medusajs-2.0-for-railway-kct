import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * Standard Medusa v2 Complete Cart Endpoint
 * 
 * This follows the Medusa v2 convention: /store/carts/{id}/complete
 * Handles both automatic and manual capture scenarios
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cartId } = req.params
  
  try {
    console.log(`[Cart Complete] Starting completion for cart: ${cartId}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    
    // Get cart with payment information
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id",
        "email",
        "currency_code",
        "total",
        "payment_collection.*",
        "payment_collection.payment_sessions.*"
      ],
    })
    
    if (!cart) {
      return res.json({
        type: "cart",
        cart: null,
        error: "Cart not found"
      })
    }
    
    // Check if payment is ready
    const paymentSessions = cart.payment_collection?.payment_sessions || []
    const stripeSession = paymentSessions.find((s: any) => 
      s.provider_id === 'stripe' || s.provider_id === 'pp_stripe_stripe'
    )
    
    if (!stripeSession) {
      return res.json({
        type: "cart",
        cart: cart,
        error: "No payment session found"
      })
    }
    
    console.log(`[Cart Complete] Payment session status: ${stripeSession.status}`)
    console.log(`[Cart Complete] Payment session data:`, stripeSession.data)
    
    // Check if we need to verify with Stripe directly
    if (stripeSession.data?.id) {
      const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2025-08-27.basil'
        })
        
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(stripeSession.data.id)
          console.log(`[Cart Complete] Stripe PaymentIntent status: ${paymentIntent.status}`)
          
          // Handle based on Stripe status
          if (paymentIntent.status === 'succeeded') {
            console.log(`[Cart Complete] Payment already captured by Stripe`)
            // Payment is already captured, skip the capture step
            stripeSession.status = 'authorized'
          } else if (paymentIntent.status === 'requires_capture') {
            console.log(`[Cart Complete] Payment requires capture`)
            // Will be captured by the workflow
          }
        } catch (stripeError) {
          console.error(`[Cart Complete] Error checking Stripe status:`, stripeError)
        }
      }
    }
    
    // Try to complete the cart using Medusa's workflow
    try {
      const { result, errors } = await completeCartWorkflow(req.scope).run({
        input: {
          id: cartId
        }
      })
      
      if (errors && errors.length > 0) {
        console.error(`[Cart Complete] Workflow errors:`, errors)
        
        // Check if error is about already captured payment
        const captureError = errors.find((e: any) => 
          e.message?.includes('already been captured') || 
          e.detail?.includes('already been captured')
        )
        
        if (captureError) {
          console.log(`[Cart Complete] Payment already captured, creating order anyway`)
          // Try alternative approach - create order directly
          // This would require additional implementation
        }
        
        return res.json({
          type: "cart",
          cart: cart,
          error: (errors[0] as any)?.message || (errors[0] as any)?.detail || "Failed to complete cart"
        })
      }
      
      console.log(`[Cart Complete] Successfully created order`)
      
      // Return in Medusa v2 format
      return res.json({
        type: "order",
        order: (result as any)?.order || result,
        message: "Order created successfully"
      })
      
    } catch (workflowError: any) {
      console.error(`[Cart Complete] Workflow error:`, workflowError)
      
      // Check if it's a capture error
      if (workflowError.message?.includes('already been captured') ||
          workflowError.message?.includes('already captured')) {
        console.log(`[Cart Complete] Handling already-captured payment`)
        
        // Payment was already captured, we should still create the order
        // For now, return cart with message
        return res.json({
          type: "cart",
          cart: cart,
          error: "Payment captured but order creation failed. Contact support with this cart ID: " + cartId,
          payment_captured: true
        })
      }
      
      return res.json({
        type: "cart",
        cart: cart,
        error: workflowError.message || "Failed to complete cart"
      })
    }
    
  } catch (error: any) {
    console.error(`[Cart Complete] Error:`, error)
    
    return res.json({
      type: "cart",
      cart: { id: cartId },
      error: error.message || "Failed to complete cart"
    })
  }
}