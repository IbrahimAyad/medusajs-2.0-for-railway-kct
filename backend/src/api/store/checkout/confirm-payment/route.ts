import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { capturePaymentUtil } from "../../../../utils/payment-capture"

/**
 * Payment Confirmation Endpoint - Client-Side Confirmation Flow
 * Endpoint: /store/checkout/confirm-payment
 * 
 * This endpoint is called directly from the frontend after Stripe payment succeeds.
 * It verifies the payment with Stripe and updates the order status.
 * This bypasses webhook signature verification issues entirely.
 */

interface ConfirmPaymentRequest {
  payment_intent_id: string
  order_id: string
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY

  if (!stripeKey) {
    console.error("[Confirm Payment] Missing Stripe API key")
    return res.status(500).json({ 
      success: false,
      error: "Payment configuration missing" 
    })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    const { payment_intent_id, order_id } = req.body as ConfirmPaymentRequest

    console.log("[Confirm Payment] Starting payment confirmation:", {
      payment_intent_id,
      order_id
    })

    // Validate required fields
    if (!payment_intent_id || !order_id) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: payment_intent_id and order_id" 
      })
    }

    // Resolve services
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)

    // Step 1: Retrieve the payment intent from Stripe
    let paymentIntent: Stripe.PaymentIntent
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)
      console.log("[Confirm Payment] Retrieved payment intent:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        metadata: paymentIntent.metadata
      })
    } catch (error: any) {
      console.error("[Confirm Payment] Failed to retrieve payment intent:", error)
      return res.status(400).json({ 
        success: false,
        error: "Invalid payment intent ID" 
      })
    }

    // Step 2: Verify payment was successful
    if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture') {
      console.warn("[Confirm Payment] Payment intent not successful:", paymentIntent.status)
      return res.status(400).json({ 
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}` 
      })
    }

    // Step 3: Retrieve the order
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: order_id },
      fields: [
        "id",
        "email",
        "total",
        "currency_code",
        "metadata",
        "status",
        "payment_status"
      ]
    })

    if (!orders || orders.length === 0) {
      console.error("[Confirm Payment] Order not found:", order_id)
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      })
    }

    const order = orders[0]
    console.log("[Confirm Payment] Found order:", {
      id: order.id,
      total: order.total,
      current_metadata: order.metadata
    })

    // Step 4: Check if payment was already confirmed (idempotency)
    if (order.metadata?.payment_captured === true) {
      console.log("[Confirm Payment] Payment already captured for order:", order.id)
      return res.json({ 
        success: true,
        message: "Payment already confirmed",
        order: {
          id: order.id,
          payment_status: "captured",
          payment_captured: true
        }
      })
    }

    // Step 5: Verify amounts match (security check)
    if (paymentIntent.amount !== order.total) {
      console.error("[Confirm Payment] Amount mismatch:", {
        payment_amount: paymentIntent.amount,
        order_total: order.total
      })
      return res.status(400).json({ 
        success: false,
        error: "Payment amount doesn't match order total" 
      })
    }

    // Step 6: Capture payment if needed
    let capturedPaymentIntent = paymentIntent
    if (paymentIntent.status === 'requires_capture') {
      try {
        capturedPaymentIntent = await stripe.paymentIntents.capture(paymentIntent.id)
        console.log("[Confirm Payment] Payment captured successfully")
      } catch (error: any) {
        console.error("[Confirm Payment] Failed to capture payment:", error)
        return res.status(500).json({ 
          success: false,
          error: "Failed to capture payment" 
        })
      }
    }

    // Step 7: Update order status using utility function
    const updateResult = await capturePaymentUtil(
      orderService,
      order.id,
      capturedPaymentIntent.id,
      capturedPaymentIntent.status,
      {
        source: 'client_confirmation',
        stripe_charge_id: capturedPaymentIntent.latest_charge as string,
        payment_method: capturedPaymentIntent.payment_method as string,
        confirmed_at: new Date().toISOString()
      }
    )

    if (!updateResult.success) {
      console.error("[Confirm Payment] Failed to update order:", updateResult.error)
      return res.status(500).json({ 
        success: false,
        error: updateResult.error || "Failed to update order status" 
      })
    }

    console.log("[Confirm Payment] ✅ Payment confirmed successfully:", {
      order_id: order.id,
      payment_intent_id: capturedPaymentIntent.id,
      status: capturedPaymentIntent.status
    })

    // Step 8: Return success response
    return res.json({
      success: true,
      message: "Payment confirmed successfully",
      order: {
        id: order.id,
        payment_status: "captured",
        payment_captured: true,
        payment_intent_id: capturedPaymentIntent.id,
        confirmed_at: new Date().toISOString()
      }
    })

  } catch (error: any) {
    console.error("[Confirm Payment] Unexpected error:", error)
    return res.status(500).json({ 
      success: false,
      error: "Failed to confirm payment",
      details: error.message
    })
  }
}

/**
 * GET endpoint to check payment status
 * Useful for polling or verification
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY

  if (!stripeKey) {
    return res.status(500).json({ 
      success: false,
      error: "Payment configuration missing" 
    })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    const payment_intent_id = req.query.payment_intent_id as string
    const order_id = req.query.order_id as string

    if (!payment_intent_id || !order_id) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required parameters: payment_intent_id and order_id" 
      })
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

    // Get order from database
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: order_id },
      fields: ["id", "metadata", "status", "payment_status"]
    })

    const order = orders?.[0]
    if (!order) {
      return res.status(404).json({ 
        success: false,
        error: "Order not found" 
      })
    }

    return res.json({
      success: true,
      payment: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount
      },
      order: {
        id: order.id,
        payment_captured: order.metadata?.payment_captured || false,
        payment_status: order.metadata?.payment_status || "pending"
      }
    })

  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      error: "Failed to check payment status",
      details: error.message
    })
  }
}