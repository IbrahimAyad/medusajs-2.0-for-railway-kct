import { defineMiddlewares } from "@medusajs/medusa"
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework"

// Middleware to fix Stripe amount calculation
const fixStripeAmount = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // Intercept payment session creation
  if (req.method === "POST" && req.path.includes("payment-sessions")) {
    const originalJson = res.json.bind(res)
    res.json = function(data: any) {
      // Log for debugging
      console.log("[STRIPE FIX] Intercepting payment session:", JSON.stringify(data, null, 2))
      
      // If this is a Stripe payment session, ensure amount is correct
      if (data?.payment_session?.provider_id === "pp_stripe_stripe") {
        // Amount should already be in cents, no multiplication needed
        console.log("[STRIPE FIX] Original amount:", data.payment_session.amount)
      }
      
      return originalJson(data)
    }
  }
  
  next()
}

// Middleware to capture raw body for Stripe webhook signature verification
const stripeWebhookRawBody = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  // Only process for Stripe webhook endpoint
  if (req.path === "/hooks/payment/stripe" && req.method === "POST") {
    let rawBody = ""
    
    // Capture raw body chunks
    req.on("data", (chunk: Buffer) => {
      rawBody += chunk.toString("utf8")
    })
    
    req.on("end", () => {
      // Store raw body for webhook handler
      (req as any).rawBody = rawBody
      
      // Parse JSON for Medusa
      try {
        req.body = JSON.parse(rawBody)
      } catch (e) {
        console.error("[Webhook Middleware] Failed to parse JSON:", e)
        req.body = {}
      }
      
      console.log("[Webhook Middleware] Captured raw body for Stripe webhook")
      next()
    })
  } else {
    next()
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/prepare-cart",
      middlewares: [],
    },
    {
      matcher: "/store/checkout-status",
      middlewares: [],
    },
    {
      matcher: "/admin/setup-product-pricing",
      middlewares: [],
    },
    {
      matcher: "/store/carts/:id/payment-sessions",
      middlewares: [fixStripeAmount],
    },
    {
      matcher: "/hooks/payment/stripe",
      middlewares: [stripeWebhookRawBody],
      bodyParser: false, // Disable default body parsing for webhook
    },
  ],
})