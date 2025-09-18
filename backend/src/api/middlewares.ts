import { defineMiddlewares } from "@medusajs/medusa"
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework"
// import { authenticateAdmin } from "./middlewares/authenticate-admin" // DISABLED: Using Medusa v2 built-in admin auth

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
  // Only process for Stripe webhook endpoints (both paths)
  if ((req.path === "/hooks/payment/stripe" || req.path === "/webhooks/stripe") && req.method === "POST") {
    console.log("[Webhook Middleware] Processing Stripe webhook request")
    
    let rawBody = Buffer.alloc(0)
    
    // Save original request properties that we might override
    const originalOn = req.on.bind(req)
    
    // If the body has already been read, try to reconstruct
    if (req.body !== undefined) {
      console.log("[Webhook Middleware] Body already parsed, reconstructing raw body")
      try {
        const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
        ;(req as any).rawBody = bodyString
        console.log("[Webhook Middleware] Raw body reconstructed from parsed body")
        return next()
      } catch (e) {
        console.error("[Webhook Middleware] Failed to reconstruct raw body:", e)
      }
    }
    
    // Override the readable stream to capture raw data
    const chunks: Buffer[] = []
    
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk)
    })
    
    req.on("end", () => {
      // Combine all chunks
      rawBody = Buffer.concat(chunks)
      
      // Store both raw buffer and string versions
      ;(req as any).rawBody = rawBody.toString("utf8")
      ;(req as any).rawBodyBuffer = rawBody
      
      // Parse JSON for Medusa if not already parsed
      if (req.body === undefined) {
        try {
          req.body = JSON.parse(rawBody.toString("utf8"))
        } catch (e) {
          console.error("[Webhook Middleware] Failed to parse JSON:", e)
          req.body = {}
        }
      }
      
      console.log("[Webhook Middleware] ✅ Captured raw body for Stripe webhook:", rawBody.length, "bytes")
      next()
    })
    
    req.on("error", (err) => {
      console.error("[Webhook Middleware] Error reading request:", err)
      next(err)
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
    // REMOVED: Custom admin authentication middleware - using Medusa v2 built-in auth
    // NOTE: Medusa v2 has built-in admin authentication that should not be overridden
    {
      matcher: "/store/carts/:id/payment-sessions",
      middlewares: [fixStripeAmount],
    },
    {
      matcher: "/hooks/payment/stripe",
      middlewares: [stripeWebhookRawBody],
      bodyParser: false, // Disable body parsing for raw body access
    },
    {
      matcher: "/webhooks/stripe",
      middlewares: [stripeWebhookRawBody],
      bodyParser: false, // Disable body parsing for raw body access
    },
  ],
})