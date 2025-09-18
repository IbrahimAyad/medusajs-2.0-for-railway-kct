import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * Process Pending Stripe Payments
 * Endpoint: GET /store/process-pending-payments
 *
 * This endpoint polls Stripe for recent successful payments and ensures they have orders.
 * Can be called manually or via cron job to work around webhook issues.
 */

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY

  if (!stripeKey) {
    return res.status(500).json({
      success: false,
      error: "Stripe not configured"
    })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)

    // Get payment intents from the last 2 hours
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200

    console.log("[Payment Processor] Fetching recent successful payments...")

    const events = await stripe.events.list({
      limit: 50,
      types: ['payment_intent.succeeded'],
      created: { gte: twoHoursAgo }
    })

    console.log(`[Payment Processor] Found ${events.data.length} payment events`)

    let processedCount = 0
    let skippedCount = 0
    let createdOrders = []

    for (const event of events.data) {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Check if order already exists
      const existingOrders = await orderService.listOrders({
        metadata: {
          payment_intent_id: paymentIntent.id
        }
      } as any)

      if (existingOrders && existingOrders.length > 0) {
        console.log(`[Payment Processor] Order already exists for payment ${paymentIntent.id}`)
        skippedCount++
        continue
      }

      // Create order from payment intent
      console.log(`[Payment Processor] Creating order for payment ${paymentIntent.id}`)

      const orderId = paymentIntent.metadata?.order_id
      const cartId = paymentIntent.metadata?.cart_id
      const email = paymentIntent.metadata?.email || paymentIntent.receipt_email || 'noemail@example.com'

      // If an order ID exists in metadata, just update it
      if (orderId) {
        try {
          await orderService.updateOrders({
            id: orderId,
            metadata: {
              payment_captured: true,
              payment_intent_id: paymentIntent.id,
              payment_status: 'captured',
              stripe_amount_received: paymentIntent.amount_received || paymentIntent.amount,
              processed_by: 'polling',
              processed_at: new Date().toISOString()
            }
          } as any)

          console.log(`[Payment Processor] Updated order ${orderId}`)
          processedCount++
          createdOrders.push({
            order_id: orderId,
            type: 'updated',
            payment_amount: paymentIntent.amount / 100
          })
        } catch (err) {
          console.error(`[Payment Processor] Failed to update order ${orderId}:`, err)
        }
        continue
      }

      // Create a new order
      try {
        const orderData = {
          email: email,
          currency_code: paymentIntent.currency || 'usd',

          // Convert from cents to dollars
          total: Math.round(paymentIntent.amount / 100),
          subtotal: Math.round(paymentIntent.amount / 100),
          tax_total: 0,
          shipping_total: 0,
          discount_total: 0,

          // Basic item from payment intent
          items: [{
            title: paymentIntent.description || `Order from ${email}`,
            quantity: 1,
            unit_price: Math.round(paymentIntent.amount / 100),
            metadata: {
              payment_intent_id: paymentIntent.id,
              created_from: 'payment_processor'
            }
          }],

          metadata: {
            cart_id: cartId || 'no-cart',
            payment_intent_id: paymentIntent.id,
            payment_captured: true,
            payment_status: 'captured',
            stripe_amount: paymentIntent.amount,
            stripe_event_id: event.id,
            created_from: 'payment_processor',
            processed_at: new Date().toISOString()
          }
        }

        const orders = await orderService.createOrders(orderData as any)
        const order = Array.isArray(orders) ? orders[0] : orders
        console.log(`[Payment Processor] Created order ${order.id}`)
        processedCount++
        createdOrders.push({
          order_id: order.id,
          type: 'created',
          payment_amount: paymentIntent.amount / 100
        })
      } catch (err: any) {
        console.error(`[Payment Processor] Failed to create order:`, err.message)
      }
    }

    const summary = {
      success: true,
      checked: events.data.length,
      processed: processedCount,
      skipped: skippedCount,
      orders: createdOrders,
      message: `Processed ${processedCount} payments, skipped ${skippedCount} (already processed)`
    }

    console.log("[Payment Processor] Summary:", summary)

    return res.json(summary)

  } catch (error: any) {
    console.error("[Payment Processor] Error:", error.message)
    return res.status(500).json({
      success: false,
      error: "Failed to process payments",
      message: error.message
    })
  }
}

// POST endpoint for manual trigger with specific payment intent
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY
  const { payment_intent_id } = req.body as any

  if (!stripeKey) {
    return res.status(500).json({
      success: false,
      error: "Stripe not configured"
    })
  }

  if (!payment_intent_id) {
    return res.status(400).json({
      success: false,
      error: "payment_intent_id required in request body"
    })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)

    console.log(`[Payment Processor] Processing specific payment intent: ${payment_intent_id}`)

    // Retrieve the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    if (paymentIntent.status !== 'succeeded') {
      return res.json({
        success: false,
        error: `Payment intent status is ${paymentIntent.status}, not succeeded`
      })
    }

    // Check if order already exists
    const existingOrders = await orderService.listOrders({
      metadata: {
        payment_intent_id: paymentIntent.id
      }
    } as any)

    if (existingOrders && existingOrders.length > 0) {
      return res.json({
        success: true,
        message: "Order already exists",
        order_id: existingOrders[0].id
      })
    }

    // Create order
    const email = paymentIntent.metadata?.email || paymentIntent.receipt_email || 'noemail@example.com'

    const orderData = {
      email: email,
      currency_code: paymentIntent.currency || 'usd',

      // Convert from cents to dollars
      total: Math.round(paymentIntent.amount / 100),
      subtotal: Math.round(paymentIntent.amount / 100),
      tax_total: 0,
      shipping_total: 0,
      discount_total: 0,

      items: [{
        title: paymentIntent.description || `Order from ${email}`,
        quantity: 1,
        unit_price: Math.round(paymentIntent.amount / 100),
        metadata: {
          payment_intent_id: paymentIntent.id,
          created_from: 'manual_processor'
        }
      }],

      metadata: {
        cart_id: paymentIntent.metadata?.cart_id || 'no-cart',
        payment_intent_id: paymentIntent.id,
        payment_captured: true,
        payment_status: 'captured',
        stripe_amount: paymentIntent.amount,
        created_from: 'manual_processor',
        processed_at: new Date().toISOString()
      }
    }

    const orders = await orderService.createOrders(orderData as any)
    const order = Array.isArray(orders) ? orders[0] : orders

    return res.json({
      success: true,
      message: "Order created successfully",
      order_id: order.id,
      amount: paymentIntent.amount / 100
    })

  } catch (error: any) {
    console.error("[Payment Processor] Error:", error.message)
    return res.status(500).json({
      success: false,
      error: "Failed to process payment",
      message: error.message
    })
  }
}