import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.acacia" as any
})

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { amount, currency = "usd", metadata = {} } = req.body
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        ...metadata,
        bypass_reason: "direct_stripe_integration"
      }
    })
    
    return res.json({
      success: true,
      client_secret: paymentIntent.client_secret
    })
  } catch (error: any) {
    console.error("Stripe bypass error:", error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}