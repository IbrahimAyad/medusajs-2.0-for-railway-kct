/**
 * Verify Stripe Configuration
 * Test endpoint to ensure Stripe is properly configured
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } from "../../lib/constants"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Check if constants are properly exported
    const hasStripeKey = !!STRIPE_API_KEY
    const hasWebhookSecret = !!STRIPE_WEBHOOK_SECRET
    
    // Verify the key format
    const keyFormat = STRIPE_API_KEY ? {
      startsWithSk: STRIPE_API_KEY.startsWith('sk_'),
      isLiveKey: STRIPE_API_KEY.includes('live'),
      length: STRIPE_API_KEY.length
    } : null
    
    res.json({
      success: true,
      stripe_configured: hasStripeKey && hasWebhookSecret,
      constants_loaded: {
        STRIPE_API_KEY: hasStripeKey,
        STRIPE_WEBHOOK_SECRET: hasWebhookSecret
      },
      key_validation: keyFormat,
      deployment: {
        environment: process.env.RAILWAY_ENVIRONMENT || 'local',
        service: process.env.RAILWAY_SERVICE_NAME || 'unknown',
        timestamp: new Date().toISOString()
      },
      message: hasStripeKey && hasWebhookSecret 
        ? "Stripe configuration verified successfully" 
        : "Stripe configuration incomplete"
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}