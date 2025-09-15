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
  console.log("[Stripe Webhook] POST request received")
  
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

  // Check for development mode bypass
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTestSignature = signature === 'test' || signature.includes('test_signature')
  
  if (isDevelopment && isTestSignature) {
    console.log("[Stripe Webhook] ⚠️ Test mode: Bypassing signature verification")
    console.log("[Stripe Webhook] Request body type:", typeof req.body)
    console.log("[Stripe Webhook] Request body keys:", req.body ? Object.keys(req.body) : 'no body')
    // Ensure we have a valid event object from request body
    if (req.body && typeof req.body === 'object' && req.body.type) {
      event = req.body as Stripe.Event
      console.log("[Stripe Webhook] Using test event:", event.type)
    } else {
      console.error("[Stripe Webhook] Invalid test event body:", JSON.stringify(req.body, null, 2))
      return res.status(400).json({ error: "Invalid test event body" })
    }
  } else {
    try {
      // Try to get raw body from middleware
      let rawBody = (req as any).rawBody

      // If no raw body from middleware, try to reconstruct from parsed body
      if (!rawBody) {
        if (typeof req.body === 'string') {
          rawBody = req.body
        } else if (typeof req.body === 'object') {
          rawBody = JSON.stringify(req.body)
        } else {
          throw new Error("Unable to get raw body for signature verification")
        }
      }
      
      console.log("[Stripe Webhook] Verifying signature with raw body length:", rawBody ? rawBody.length : 'undefined')
      
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
      console.error("[Stripe Webhook] Raw body available:", !!(req as any).rawBody)
      console.error("[Stripe Webhook] Request body type:", typeof req.body)
      return res.status(400).json({ error: `Webhook Error: ${err.message}` })
    }
  }

  // Verify event is properly parsed
  if (!event || !event.type) {
    console.error("[Stripe Webhook] Invalid event object:", event)
    return res.status(400).json({ error: "Invalid event object" })
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type}`)

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(req, res, event)
        
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(req, res, event)
        
      case 'charge.succeeded':
        // Also handle charge.succeeded for compatibility
        console.log("[Stripe Webhook] Charge succeeded:", event.data.object)
        return res.json({ received: true })
        
      case 'checkout.session.completed':
        // Handle standard checkout sessions if used
        return await handleCheckoutSessionCompleted(req, res, event)
        
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
        return res.json({ received: true })
    }
  } catch (error: any) {
    console.error("[Stripe Webhook] Error processing event:", error)
    return res.status(500).json({ 
      received: false, 
      error: error.message 
    })
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

    // Update order metadata (payment_status doesn't exist on Order model in Medusa v2)
    const updateData = {
      metadata: {
        ...order.metadata,
        payment_intent_id: paymentIntent.id,
        payment_captured_at: new Date().toISOString(),
        stripe_payment_status: paymentIntent.status,
        payment_captured: true,
        webhook_processed: true,
        webhook_source: 'stripe_payment_intent_succeeded',
        payment_status: 'captured' // Store in metadata instead
      }
    }

    console.log("[Stripe Webhook] Updating order with payment captured metadata:", {
      orderId,
      paymentCaptured: true,
      paymentIntentId: paymentIntent.id,
      paymentStatus: 'captured'
    })

    await orderService.updateOrders({
      id: orderId,
      ...updateData
    } as any)

    console.log(`[Stripe Webhook] ✅ Order ${orderId} payment captured metadata updated`)

    // Also try to update any associated payment collections
    try {
      const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
      
      // Find payment collections for this order
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: paymentCollections } = await query.graph({
        entity: "payment_collection",
        filters: {
          metadata: {
            order_id: orderId
          }
        },
        fields: ["id", "status", "amount", "metadata"]
      })

      if (paymentCollections && paymentCollections.length > 0) {
        for (const collection of paymentCollections) {
          console.log(`[Stripe Webhook] Updating payment collection ${collection.id} for order ${orderId}`)
          
          await paymentService.updatePaymentCollections({
            id: collection.id,
            metadata: {
              ...collection.metadata,
              payment_captured: true,
              payment_intent_id: paymentIntent.id,
              webhook_processed: true
            }
          } as any)
        }
      }
    } catch (paymentError) {
      console.warn("[Stripe Webhook] Could not update payment collections:", paymentError)
      // Don't fail the webhook if payment collection update fails
    }

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