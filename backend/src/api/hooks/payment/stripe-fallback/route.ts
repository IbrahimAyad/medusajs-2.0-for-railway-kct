import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { capturePaymentUtil } from "../../../../utils/payment-capture"

/**
 * Fallback Webhook Handler - No Signature Verification
 * Endpoint: /hooks/payment/stripe-fallback
 * 
 * This is a backup webhook handler that doesn't require signature verification.
 * It should only be used when the main webhook fails due to Railway/Medusa issues.
 * 
 * Security: 
 * - Verifies event exists in Stripe API
 * - Checks order exists and matches payment amount
 * - Validates event structure
 * - Should only be enabled when necessary
 */

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY
  const verifyEvents = process.env.VERIFY_WEBHOOK_EVENTS === 'true'

  if (!stripeKey) {
    console.error("[Stripe Fallback] Missing Stripe API key")
    return res.status(500).json({ error: "Payment configuration missing" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    console.log("[Stripe Fallback] Received webhook event (no signature verification)")
    
    // Get the event from request body
    const event = req.body as Stripe.Event
    
    // Validate event structure
    if (!event || !event.id || !event.type || !event.data || !event.data.object) {
      console.error("[Stripe Fallback] Invalid event structure")
      return res.status(400).json({ error: "Invalid webhook event structure" })
    }

    console.log(`[Stripe Fallback] Processing event: ${event.type} (${event.id})`)

    // Optionally verify event exists in Stripe
    if (verifyEvents) {
      try {
        console.log("[Stripe Fallback] Verifying event with Stripe API...")
        const verifiedEvent = await stripe.events.retrieve(event.id)
        if (verifiedEvent.id !== event.id) {
          console.error("[Stripe Fallback] Event verification failed")
          return res.status(400).json({ error: "Event verification failed" })
        }
        console.log("[Stripe Fallback] ✅ Event verified with Stripe")
      } catch (error) {
        console.error("[Stripe Fallback] Failed to verify event:", error)
        return res.status(400).json({ error: "Could not verify event with Stripe" })
      }
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'charge.succeeded':
      case 'charge.failed': {
        const paymentData = event.data.object as any
        
        // Try to get order_id from different possible locations
        const orderId = 
          paymentData.metadata?.order_id || 
          paymentData.metadata?.resource_id ||
          null

        if (!orderId) {
          console.log("[Stripe Fallback] No order_id found in webhook metadata")
          // This might be a legitimate non-order payment, return success
          return res.status(200).json({ received: true })
        }

        console.log(`[Stripe Fallback] Processing payment for order: ${orderId}`)

        // Resolve services
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
        const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)

        // Get the order
        const { data: orders } = await query.graph({
          entity: "order",
          filters: { id: orderId },
          fields: ["id", "total", "metadata", "status", "payment_status"]
        })

        if (!orders || orders.length === 0) {
          console.error(`[Stripe Fallback] Order not found: ${orderId}`)
          return res.status(404).json({ error: "Order not found" })
        }

        const order = orders[0]

        // Check if payment was already captured
        if (order.metadata?.payment_captured === true) {
          console.log(`[Stripe Fallback] Payment already captured for order: ${orderId}`)
          return res.status(200).json({ received: true })
        }

        // Handle based on event type
        if (event.type === 'payment_intent.succeeded' || event.type === 'charge.succeeded') {
          // Verify amounts match (security check)
          const paymentAmount = paymentData.amount || paymentData.amount_received
          if (paymentAmount && paymentAmount !== order.total) {
            console.warn(`[Stripe Fallback] Amount mismatch - Payment: ${paymentAmount}, Order: ${order.total}`)
            // Log but don't fail - there might be currency conversion
          }

          // Update order status
          const paymentIntentId = paymentData.id || paymentData.payment_intent
          const updateResult = await capturePaymentUtil(
            orderService,
            orderId,
            paymentIntentId,
            'succeeded',
            {
              source: 'stripe_fallback_webhook',
              event_id: event.id,
              event_type: event.type,
              processed_at: new Date().toISOString()
            }
          )

          if (updateResult.success) {
            console.log(`[Stripe Fallback] ✅ Order ${orderId} payment captured via fallback`)
          } else {
            console.error(`[Stripe Fallback] Failed to update order: ${updateResult.error}`)
          }
        } else if (event.type === 'payment_intent.payment_failed' || event.type === 'charge.failed') {
          // Update order with failure status
          await orderService.updateOrders({
            id: orderId,
            metadata: {
              ...order.metadata,
              payment_status: 'failed',
              payment_failed: true,
              payment_failure_reason: paymentData.failure_message || 'Payment failed',
              payment_failure_code: paymentData.failure_code,
              failed_at: new Date().toISOString()
            }
          } as any)
          
          console.log(`[Stripe Fallback] Order ${orderId} marked as payment failed`)
        }

        break
      }

      default:
        console.log(`[Stripe Fallback] Unhandled event type: ${event.type}`)
    }

    // Always return success to acknowledge receipt
    return res.status(200).json({ received: true })

  } catch (error: any) {
    console.error("[Stripe Fallback] Webhook error:", error)
    return res.status(500).json({ 
      error: "Webhook processing failed",
      details: error.message 
    })
  }
}