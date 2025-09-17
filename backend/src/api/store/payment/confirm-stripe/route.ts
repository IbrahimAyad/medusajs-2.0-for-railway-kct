import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2025-08-27.basil",
})

interface ConfirmPaymentRequest {
  payment_intent_id: string
  order_id?: string
}

/**
 * Payment Confirmation Endpoint
 * Called from frontend after Stripe payment succeeds
 * Updates order status to paid and logs activity
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("🎯 Payment Confirmation Request Received")
  
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
    
    const { payment_intent_id, order_id } = req.body as ConfirmPaymentRequest

    if (!payment_intent_id) {
      return res.status(400).json({
        success: false,
        error: "payment_intent_id is required"
      })
    }

    console.log(`[Payment Confirmation] Processing: ${payment_intent_id}`)
    if (order_id) {
      console.log(`[Payment Confirmation] For order: ${order_id}`)
    }

    // Step 1: Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
    
    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        error: "Payment intent not found"
      })
    }

    console.log(`[Payment Confirmation] Stripe status: ${paymentIntent.status}`)
    console.log(`[Payment Confirmation] Amount: ${paymentIntent.amount} ${paymentIntent.currency}`)

    // Check if payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}`,
        payment_status: paymentIntent.status
      })
    }

    // Step 2: Find the order
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    
    let targetOrderId = order_id

    // If no order_id provided, try to find it from payment metadata
    if (!targetOrderId && paymentIntent.metadata?.order_id) {
      targetOrderId = paymentIntent.metadata.order_id
    }

    if (!targetOrderId) {
      console.warn(`[Payment Confirmation] No order_id found for payment: ${payment_intent_id}`)
      return res.status(400).json({
        success: false,
        error: "No order_id found in request or payment metadata",
        payment_intent_id,
        metadata: paymentIntent.metadata
      })
    }

    // Step 3: Retrieve the order
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: targetOrderId },
      fields: ["id", "status", "total", "metadata", "payment_status", "email"]
    })

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Order not found: ${targetOrderId}`
      })
    }

    const order = orders[0]
    console.log(`[Payment Confirmation] Found order: ${order.id}`)
    console.log(`[Payment Confirmation] Current payment status: ${order.payment_status}`)

    // Step 4: Check if already processed
    if (order.metadata?.payment_captured === true) {
      console.log(`[Payment Confirmation] Payment already captured for order: ${order.id}`)
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        order_id: order.id,
        payment_status: "captured",
        already_processed: true
      })
    }

    // Step 5: Update order with payment confirmation
    const existingActivityLog = order.metadata?.activity_log || []
    
    const updatedMetadata = {
      ...order.metadata,
      payment_captured: true,
      payment_status: "captured",
      payment_intent_id: payment_intent_id,
      payment_confirmed_at: new Date().toISOString(),
      stripe_payment_status: paymentIntent.status,
      stripe_payment_amount: paymentIntent.amount,
      stripe_receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
      ready_for_fulfillment: true,
      // Update activity log
      activity_log: [
        ...existingActivityLog,
        {
          timestamp: new Date().toISOString(),
          action: "payment_confirmed",
          details: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} ${paymentIntent.currency.toUpperCase()} confirmed via Stripe`,
          user: "system",
          status: "captured",
          payment_intent_id: payment_intent_id,
          stripe_status: paymentIntent.status
        }
      ]
    }

    // Update the order
    await orderService.updateOrders({
      id: order.id,
      metadata: updatedMetadata,
      // Note: In Medusa v2, payment_status might not be directly updatable
      // It's managed through payment collections. We track it in metadata instead.
    } as any)

    console.log(`[Payment Confirmation] ✅ Order ${order.id} updated successfully`)
    console.log(`[Payment Confirmation] Payment marked as captured`)

    // Step 6: Return success response
    const response = {
      success: true,
      message: "Payment confirmed successfully",
      order_id: order.id,
      payment_intent_id: payment_intent_id,
      payment_status: "captured",
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url || null,
      confirmed_at: new Date().toISOString()
    }

    console.log(`[Payment Confirmation] Response:`, response)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error("❌ Payment Confirmation Error:", error)
    
    // Set CORS headers for errors too
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Payment confirmation failed",
      details: error instanceof Error ? error.stack : undefined
    })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  return res.status(200).json({ message: 'CORS OK' })
}

// Handle GET requests for testing
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("🔍 Payment Confirmation endpoint health check")
  
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  
  return res.status(200).json({
    message: "Payment confirmation endpoint operational",
    description: "Updates order status after Stripe payment succeeds",
    timestamp: new Date().toISOString(),
    stripe_configured: !!process.env.STRIPE_API_KEY,
    endpoint: "POST /store/payment/confirm-stripe",
    required_fields: ["payment_intent_id"],
    optional_fields: ["order_id"],
    features: [
      "Verifies payment with Stripe",
      "Updates order payment status",
      "Adds to activity timeline",
      "Marks order ready for fulfillment",
      "Stores receipt URL"
    ]
  })
}