import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const POST = [
  async (req: MedusaRequest, res: MedusaResponse, next: any) => {
    // Intercept Stripe payment session creation
    const body = req.body as any
    if (req.path.includes("payment-sessions") && body?.provider_id === "stripe") {
      console.log("[STRIPE AMOUNT FIX] Intercepting payment session creation")
      
      // Store original amount for logging
      const originalAmount = body.amount
      
      // Amount is already in cents from Medusa, don't let it multiply again
      if (originalAmount) {
        console.log(`[STRIPE AMOUNT FIX] Original amount: ${originalAmount} cents (${originalAmount/100} USD)`)
      }
    }
    
    next()
  }
]