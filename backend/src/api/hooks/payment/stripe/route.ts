import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, IPaymentModuleService, ICustomerModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import Stripe from "stripe"
import { createOrderFromPaymentIntent, shouldUseFallback } from "./create-order-fallback"

/**
 * Stripe Webhook Handler for Payment Events
 * Endpoint: /hooks/payment/stripe
 * 
 * This handles payment_intent.succeeded events from our custom checkout flow
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_API_KEY

  if (!webhookSecret || !stripeKey) {
    console.error("[Stripe Webhook] Missing webhook secret or API key")
    return res.status(500).json({ error: "Webhook not configured" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  // Get the signature from headers
  const signature = req.headers['stripe-signature'] as string

  if (!signature) {
    console.error("[Stripe Webhook] No signature provided")
    return res.status(400).json({ error: "No signature" })
  }

  let event: Stripe.Event

  // Allow test mode in development without signature verification
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTestSignature = signature === 'test' || signature.includes('test_signature')
  
  if (isDevelopment && isTestSignature) {
    console.log("[Stripe Webhook] ⚠️ Test mode: Bypassing signature verification")
    event = req.body as Stripe.Event
  } else {
    try {
      // Get raw body from middleware or fallback to stringified body
      const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
      
      console.log("[Stripe Webhook] Verifying signature with raw body length:", rawBody.length)
      
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      )
      
      console.log("[Stripe Webhook] ✅ Signature verified successfully")
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message)
      console.error("[Stripe Webhook] Webhook secret:", webhookSecret ? "Present" : "Missing")
      console.error("[Stripe Webhook] Signature:", signature ? "Present" : "Missing")
      return res.status(400).json({ error: `Webhook Error: ${err.message}` })
    }
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(req, res, event)
      break
      
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(req, res, event)
      break
      
    case 'charge.succeeded':
      // Also handle charge.succeeded for compatibility
      console.log("[Stripe Webhook] Charge succeeded:", event.data.object)
      res.json({ received: true })
      break
      
    case 'checkout.session.completed':
      // Handle standard checkout sessions if used
      await handleCheckoutSessionCompleted(req, res, event)
      break
      
    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
      res.json({ received: true })
  }
}

async function handlePaymentIntentSucceeded(
  req: MedusaRequest,
  res: MedusaResponse,
  event: Stripe.Event
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const cartId = paymentIntent.metadata?.cartId || paymentIntent.metadata?.cart_id
  const orderId = paymentIntent.metadata?.order_id
  const email = paymentIntent.metadata?.email

  console.log("[Stripe Webhook] Payment intent succeeded:", {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    cartId,
    orderId,
    email,
    source: paymentIntent.metadata?.source
  })

  // NEW: Handle order-first checkout flow
  if (orderId) {
    console.log("[Stripe Webhook] Order-first checkout detected, updating existing order:", orderId)
    return await handleOrderFirstPayment(req, res, paymentIntent, orderId)
  }

  if (!cartId) {
    console.warn("[Stripe Webhook] No cart ID or order ID in payment intent metadata")
    // Still process the payment and create customer
    // return res.json({ received: true, warning: "No cart ID" })
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Check if cart exists
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: ["id", "email", "total", "currency_code", "payment_collection.*"]
    })

    if (!cart && cartId) {
      console.error(`[Stripe Webhook] Cart not found: ${cartId}`)
      // Check if order already exists with this cart ID
      const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
      try {
        // In Medusa v2, we need to use metadata to find orders by cart_id
        const orders = await orderService.listOrders({
          metadata: {
            cart_id: cartId
          }
        } as any)
        if (orders?.length > 0) {
          console.log(`[Stripe Webhook] Order already exists for cart ${cartId}: ${orders[0].id}`)
          return res.json({ received: true, info: "Order already exists", order_id: orders[0].id })
        }
      } catch (e) {
        console.log("[Stripe Webhook] Could not check for existing orders:", e)
      }
      
      // Use fallback order creation when cart doesn't exist
      console.log("[Stripe Webhook] Cart not found, using fallback order creation")
      const fallbackResult = await createOrderFromPaymentIntent(req, paymentIntent)
      
      if (fallbackResult.success) {
        console.log(`[Stripe Webhook] ✅ Fallback order created successfully`)
        return res.json({ 
          received: true, 
          success: true,
          order: fallbackResult.order,
          message: fallbackResult.message
        })
      } else {
        console.error("[Stripe Webhook] Fallback order creation failed:", fallbackResult.error)
        return res.json({ 
          received: true, 
          warning: "Cart not found and fallback order creation failed",
          error: fallbackResult.error
        })
      }
    }

    // Check if we should use fallback
    if (shouldUseFallback(cart)) {
      console.log("[Stripe Webhook] Cart exists but using fallback due to:", {
        hasCart: !!cart,
        completedAt: cart?.completed_at,
        itemCount: cart?.items?.length || 0,
        hasPaymentCollection: !!cart?.payment_collection
      })
      
      const fallbackResult = await createOrderFromPaymentIntent(req, paymentIntent)
      
      if (fallbackResult.success) {
        console.log(`[Stripe Webhook] ✅ Fallback order created successfully`)
        return res.json({ 
          received: true, 
          success: true,
          order: fallbackResult.order,
          message: fallbackResult.message
        })
      }
    }

    console.log("[Stripe Webhook] Found cart, attempting to complete order")

    // Complete the cart to create an order
    try {
      const { result } = await completeCartWorkflow.run({
        input: {
          id: cartId,  // Changed from cart_id to id
        },
        container: req.scope,
      })

      if (result) {
        console.log(`[Stripe Webhook] ✅ Order created successfully`)
        console.log(`[Stripe Webhook] Order result:`, result)
        
        // Update order with metadata for tracking
        try {
          const orderId = (result as any).id || (result as any).order_id
          if (orderId) {
            const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
            await orderService.updateOrders({
              id: orderId,
              metadata: {
                cart_id: cartId,
                payment_intent_id: paymentIntent.id,
                source: 'stripe_webhook'
              }
            } as any)
            console.log(`[Stripe Webhook] Added metadata to order: ${orderId}`)
          }
        } catch (metaError) {
          console.error("[Stripe Webhook] Error adding metadata:", metaError)
        }
        
        return res.json({ 
          received: true, 
          success: true, 
          order: result 
        })
      } else {
        console.warn("[Stripe Webhook] Cart completion didn't create order")
        return res.json({ 
          received: true, 
          warning: "Cart completed but no order created" 
        })
      }
    } catch (completeError: any) {
      console.error("[Stripe Webhook] Error completing cart:", completeError)
      
      // Try alternative: Mark payment as captured
      const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
      
      if (cart.payment_collection?.id) {
        try {
          // Find the payment session
          const paymentSessions = await paymentService.listPaymentSessions({
            payment_collection_id: cart.payment_collection.id
          })
          
          const stripeSession = paymentSessions.find(s => 
            s.provider_id === 'pp_stripe_stripe' || s.data?.id === paymentIntent.id
          )
          
          if (stripeSession) {
            // Mark as authorized
            await paymentService.updatePaymentSession({
              id: stripeSession.id,
              currency_code: 'usd',
              amount: paymentIntent.amount,
              data: {
                ...stripeSession.data,
                status: 'authorized',
                payment_intent_id: paymentIntent.id
              }
            })
            
            console.log("[Stripe Webhook] Payment session marked as authorized")
          }
        } catch (sessionError) {
          console.error("[Stripe Webhook] Error updating payment session:", sessionError)
        }
      }
      
      return res.json({ 
        received: true, 
        error: "Could not complete order",
        details: completeError.message 
      })
    }
  } catch (error: any) {
    console.error("[Stripe Webhook] Error processing payment:", error)
    return res.status(500).json({ 
      received: false, 
      error: error.message 
    })
  }
}

/**
 * Handle order-first payment success
 * Updates existing order status when payment is completed
 */
async function handleOrderFirstPayment(
  req: MedusaRequest,
  res: MedusaResponse,
  paymentIntent: Stripe.PaymentIntent,
  orderId: string
) {
  try {
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    
    console.log("[Stripe Webhook] Processing order-first payment for order:", orderId)

    // Check if order exists
    const orders = await orderService.listOrders({ id: orderId })
    const order = orders?.[0]

    if (!order) {
      console.error(`[Stripe Webhook] Order not found: ${orderId}`)
      return res.status(404).json({ 
        received: false, 
        error: `Order ${orderId} not found` 
      })
    }

    console.log("[Stripe Webhook] Found order:", {
      id: order.id,
      total: order.total,
      email: order.email,
      metadata: order.metadata
    })

    // Check if order is already completed/captured via metadata
    const isPaymentCaptured = order.metadata?.payment_captured === true || order.metadata?.stripe_payment_status === 'succeeded'
    if (isPaymentCaptured) {
      console.log(`[Stripe Webhook] Order ${orderId} already has captured payment`)
      return res.json({ 
        received: true, 
        info: "Order already processed",
        order_id: orderId,
        payment_captured: true
      })
    }

    // Verify payment amount matches order total
    const orderAmountInCents = Math.round(Number(order.total) * 100) // Convert BigNumberValue to cents
    if (Math.abs(paymentIntent.amount - orderAmountInCents) > 1) {
      console.warn(`[Stripe Webhook] Payment amount mismatch for order ${orderId}:`, {
        payment_amount: paymentIntent.amount,
        order_amount: orderAmountInCents,
        difference: Math.abs(paymentIntent.amount - orderAmountInCents)
      })
    }

    // Update order status via metadata
    const updateData = {
      metadata: {
        ...order.metadata,
        payment_intent_id: paymentIntent.id,
        payment_captured_at: new Date().toISOString(),
        stripe_payment_status: paymentIntent.status,
        payment_captured: true,
        webhook_processed: true
      }
    }

    console.log("[Stripe Webhook] Updating order metadata:", {
      orderId,
      paymentCaptured: true,
      paymentIntentId: paymentIntent.id
    })

    await orderService.updateOrders({
      id: orderId,
      ...updateData
    } as any)

    console.log(`[Stripe Webhook] ✅ Order ${orderId} payment metadata updated`)

    return res.json({
      received: true,
      success: true,
      order_id: orderId,
      payment_captured: true,
      message: 'Order payment captured successfully'
    })

  } catch (error: any) {
    console.error("[Stripe Webhook] Error processing order-first payment:", error)
    return res.status(500).json({
      received: false,
      error: `Failed to process order-first payment: ${error.message}`,
      order_id: orderId
    })
  }
}

async function handlePaymentIntentFailed(
  req: MedusaRequest,
  res: MedusaResponse,
  event: Stripe.Event
) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  console.log("[Stripe Webhook] Payment failed:", paymentIntent.id)
  
  // You could update order status or notify customer here
  
  res.json({ received: true })
}

async function handleCheckoutSessionCompleted(
  req: MedusaRequest,
  res: MedusaResponse,
  event: Stripe.Event
) {
  const session = event.data.object as Stripe.Checkout.Session
  const cartId = session.metadata?.cart_id
  
  console.log("[Stripe Webhook] Checkout session completed:", {
    id: session.id,
    cartId,
    payment_intent: session.payment_intent
  })
  
  // Similar logic to handlePaymentIntentSucceeded
  // but for checkout.session.completed events
  
  res.json({ received: true })
}