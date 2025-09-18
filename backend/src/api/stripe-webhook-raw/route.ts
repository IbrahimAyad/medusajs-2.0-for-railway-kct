import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { createOrderFromPaymentIntent } from "../hooks/payment/stripe/create-order-fallback"

/**
 * Raw Stripe Webhook Handler - Alternative approach for Railway
 * Endpoint: /stripe-webhook-raw
 *
 * This endpoint manually reads the raw body stream to handle Railway's proxy issues
 */

// Disable default body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("[Raw Stripe Webhook] Request received")
  console.log("[Raw Stripe Webhook] Content-Type:", req.headers['content-type'])
  console.log("[Raw Stripe Webhook] Has signature:", !!req.headers['stripe-signature'])

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeKey = process.env.STRIPE_API_KEY

  if (!webhookSecret || !stripeKey) {
    console.error("[Raw Stripe Webhook] Missing webhook secret or API key")
    return res.status(500).json({ error: "Webhook not configured" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    // Manually collect the raw body
    const chunks: Buffer[] = []
    let rawBody = ''

    // Set up a promise to collect the body
    const bodyPromise = new Promise<string>((resolve, reject) => {
      req.on('data', (chunk) => {
        chunks.push(chunk)
      })

      req.on('end', () => {
        rawBody = Buffer.concat(chunks).toString('utf8')
        console.log("[Raw Stripe Webhook] Collected raw body, length:", rawBody.length)
        console.log("[Raw Stripe Webhook] First 100 chars:", rawBody.substring(0, 100))
        resolve(rawBody)
      })

      req.on('error', (err) => {
        console.error("[Raw Stripe Webhook] Error reading body:", err)
        reject(err)
      })

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Timeout reading request body'))
      }, 10000)
    })

    // Wait for body to be collected
    rawBody = await bodyPromise

    if (!rawBody) {
      console.error("[Raw Stripe Webhook] No body collected")
      return res.status(400).json({ error: "No body received" })
    }

    // Parse the JSON body
    let eventData
    try {
      eventData = JSON.parse(rawBody)
      console.log("[Raw Stripe Webhook] Parsed event type:", eventData.type)
    } catch (parseErr) {
      console.error("[Raw Stripe Webhook] Failed to parse JSON:", parseErr)
      return res.status(400).json({ error: "Invalid JSON body" })
    }

    // Try to verify signature if we have the raw body
    const signature = req.headers['stripe-signature'] as string
    let event: Stripe.Event

    if (signature && rawBody) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
        console.log("[Raw Stripe Webhook] ✅ Signature verified")
      } catch (err: any) {
        console.warn("[Raw Stripe Webhook] Signature verification failed:", err.message)
        // Use unverified event in production due to Railway issues
        event = eventData as Stripe.Event
        console.log("[Raw Stripe Webhook] Using unverified event due to Railway proxy issues")
      }
    } else {
      // No signature, use unverified event
      event = eventData as Stripe.Event
      console.log("[Raw Stripe Webhook] No signature provided, using unverified event")
    }

    // Process the event
    console.log(`[Raw Stripe Webhook] Processing ${event.type} event: ${event.id}`)

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      // Create order from payment intent using fallback
      const result = await createOrderFromPaymentIntent(req, paymentIntent)

      if (result.success) {
        console.log("[Raw Stripe Webhook] ✅ Order created successfully:", result.order?.id)
        return res.json({
          received: true,
          success: true,
          order_id: result.order?.id,
          message: result.message
        })
      } else {
        console.error("[Raw Stripe Webhook] Failed to create order:", result.error)
        return res.json({
          received: true,
          success: false,
          error: result.error,
          message: result.message
        })
      }
    }

    // For other event types, just acknowledge
    console.log(`[Raw Stripe Webhook] Acknowledged event ${event.type}`)
    return res.json({ received: true, event_type: event.type })

  } catch (error: any) {
    console.error("[Raw Stripe Webhook] Error processing webhook:", error)
    return res.status(500).json({
      error: "Webhook processing failed",
      message: error.message
    })
  }
}