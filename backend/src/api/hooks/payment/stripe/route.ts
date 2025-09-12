import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, IPaymentModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import Stripe from "stripe"

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

  try {
    // Verify webhook signature
    const rawBody = req.body
    event = stripe.webhooks.constructEvent(
      typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody),
      signature,
      webhookSecret
    )
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
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
  const cartId = paymentIntent.metadata?.cartId
  const email = paymentIntent.metadata?.email

  console.log("[Stripe Webhook] Payment intent succeeded:", {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    cartId,
    email
  })

  if (!cartId) {
    console.warn("[Stripe Webhook] No cart ID in payment intent metadata")
    return res.json({ received: true, warning: "No cart ID" })
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Check if cart exists
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: ["id", "email", "total", "currency_code", "payment_collection.*"]
    })

    if (!cart) {
      console.error(`[Stripe Webhook] Cart not found: ${cartId}`)
      // Check if order already exists with this cart ID
      const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
      try {
        const orders = await orderService.listOrders({
          cart_id: cartId
        })
        if (orders?.length > 0) {
          console.log(`[Stripe Webhook] Order already exists for cart ${cartId}: ${orders[0].id}`)
          return res.json({ received: true, info: "Order already exists", order_id: orders[0].id })
        }
      } catch (e) {
        console.log("[Stripe Webhook] Could not check for existing orders")
      }
      // Cart might already be completed
      return res.json({ received: true, info: "Cart not found or already completed" })
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
            s.provider_id === 'stripe' || s.data?.id === paymentIntent.id
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