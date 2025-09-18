import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * Stripe Webhook Fallback Handler
 * Endpoint: /stripe-webhook-fallback
 *
 * This endpoint retrieves events directly from Stripe API when webhook body is missing
 * Works around Railway's webhook body stripping issue
 */

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("[Webhook Fallback] Request received")

  const stripeKey = process.env.STRIPE_API_KEY
  if (!stripeKey) {
    console.error("[Webhook Fallback] Missing Stripe API key")
    return res.status(500).json({ error: "Stripe not configured" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    // Try to get event ID from various sources
    let eventId = null

    // Try from body if available
    if (req.body && typeof req.body === 'object' && (req.body as any).id) {
      eventId = (req.body as any).id
      console.log("[Webhook Fallback] Got event ID from body:", eventId)
    }

    // Try from headers (custom header we might add)
    if (!eventId && req.headers['x-stripe-event-id']) {
      eventId = req.headers['x-stripe-event-id'] as string
      console.log("[Webhook Fallback] Got event ID from header:", eventId)
    }

    // Try from query params as last resort
    if (!eventId && req.query && req.query.event_id) {
      eventId = req.query.event_id as string
      console.log("[Webhook Fallback] Got event ID from query:", eventId)
    }

    if (!eventId) {
      // If no event ID, fetch recent events and process unprocessed ones
      console.log("[Webhook Fallback] No event ID, fetching recent events")

      const events = await stripe.events.list({
        limit: 10,
        types: ['payment_intent.succeeded']
      })

      console.log(`[Webhook Fallback] Found ${events.data.length} recent payment events`)

      // Process the most recent unprocessed event
      for (const event of events.data) {
        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object as Stripe.PaymentIntent

          // Check if this payment has already been processed
          const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
          const existingOrders = await orderService.listOrders({
            metadata: {
              payment_intent_id: paymentIntent.id
            }
          } as any)

          if (existingOrders && existingOrders.length > 0) {
            console.log(`[Webhook Fallback] Payment ${paymentIntent.id} already processed`)
            continue
          }

          // Process this payment
          console.log(`[Webhook Fallback] Processing unprocessed payment: ${paymentIntent.id}`)
          await processPaymentIntent(req, res, paymentIntent)
          return // Exit after processing one event
        }
      }

      return res.json({
        received: true,
        message: "No unprocessed payments found"
      })
    }

    // Fetch the specific event from Stripe
    console.log("[Webhook Fallback] Fetching event from Stripe:", eventId)
    const event = await stripe.events.retrieve(eventId)

    if (!event) {
      console.error("[Webhook Fallback] Event not found in Stripe:", eventId)
      return res.status(404).json({ error: "Event not found" })
    }

    console.log(`[Webhook Fallback] Retrieved event ${event.type} from Stripe`)

    // Process based on event type
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      await processPaymentIntent(req, res, paymentIntent)
    } else {
      console.log(`[Webhook Fallback] Acknowledged event type: ${event.type}`)
      res.json({ received: true, event_type: event.type })
    }

  } catch (error: any) {
    console.error("[Webhook Fallback] Error:", error.message)
    return res.status(500).json({
      error: "Failed to process webhook",
      message: error.message
    })
  }
}

async function processPaymentIntent(
  req: MedusaRequest,
  res: MedusaResponse,
  paymentIntent: Stripe.PaymentIntent
) {
  const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)

  // Extract order data from payment intent metadata
  const cartId = paymentIntent.metadata?.cart_id
  const orderId = paymentIntent.metadata?.order_id
  const email = paymentIntent.metadata?.email || paymentIntent.receipt_email

  console.log("[Webhook Fallback] Processing payment:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    cartId,
    orderId,
    email
  })

  // If we have an order ID, just update its payment status
  if (orderId) {
    try {
      await orderService.updateOrders({
        id: orderId,
        metadata: {
          payment_captured: true,
          payment_intent_id: paymentIntent.id,
          payment_status: 'captured',
          stripe_amount_received: paymentIntent.amount_received || paymentIntent.amount,
          webhook_processed: true,
          webhook_processed_at: new Date().toISOString()
        }
      } as any)

      console.log(`[Webhook Fallback] ✅ Updated order ${orderId} payment status`)

      return res.json({
        received: true,
        success: true,
        order_id: orderId,
        message: "Payment status updated"
      })
    } catch (error: any) {
      console.error("[Webhook Fallback] Error updating order:", error)
      return res.json({
        received: true,
        success: false,
        error: error.message
      })
    }
  }

  // If no order exists, create a minimal one
  console.log("[Webhook Fallback] No order found, creating fallback order")

  try {
    const orderData = {
      email: email || 'noemail@example.com',
      currency_code: paymentIntent.currency || 'usd',

      // Convert amount from cents to dollars for Medusa
      total: Math.round(paymentIntent.amount / 100),
      subtotal: Math.round(paymentIntent.amount / 100),
      tax_total: 0,
      shipping_total: 0,
      discount_total: 0,

      // Fallback items
      items: [{
        title: paymentIntent.description || 'Product',
        quantity: 1,
        unit_price: Math.round(paymentIntent.amount / 100),
        metadata: {
          payment_intent_id: paymentIntent.id,
          fallback_order: true
        }
      }],

      metadata: {
        cart_id: cartId || 'no-cart',
        payment_intent_id: paymentIntent.id,
        payment_captured: true,
        payment_status: 'captured',
        stripe_amount: paymentIntent.amount,
        created_from: 'webhook_fallback',
        webhook_processed: true
      }
    }

    const order = await orderService.createOrders(orderData as any)
    console.log(`[Webhook Fallback] ✅ Created fallback order:`, order.id)

    res.json({
      received: true,
      success: true,
      order_id: order.id,
      message: "Fallback order created from payment"
    })

  } catch (error: any) {
    console.error("[Webhook Fallback] Error creating fallback order:", error)
    res.json({
      received: true,
      success: false,
      error: error.message,
      message: "Failed to create fallback order"
    })
  }
}