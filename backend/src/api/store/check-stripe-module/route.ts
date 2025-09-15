import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Check environment variables
    const hasApiKey = !!process.env.STRIPE_API_KEY
    const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET
    
    // Try to get the payment provider service
    let stripeProviderExists = false
    let containerError = null
    
    try {
      const container = req.scope
      // Try to resolve the stripe provider
      const stripeProvider = container.resolve('stripe')
      stripeProviderExists = !!stripeProvider
    } catch (error: any) {
      containerError = error.message
    }
    
    // Check if payment module is loaded
    let paymentModuleLoaded = false
    try {
      const paymentService = req.scope.resolve('payment')
      paymentModuleLoaded = !!paymentService
    } catch (e) {
      // Payment module not loaded
    }
    
    return res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        has_stripe_api_key: hasApiKey,
        has_stripe_webhook: hasWebhook,
        api_key_preview: process.env.STRIPE_API_KEY ? 
          `${process.env.STRIPE_API_KEY.substring(0, 10)}...` : null,
        webhook_preview: process.env.STRIPE_WEBHOOK_SECRET ?
          `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...` : null
      },
      module_status: {
        payment_module_loaded: paymentModuleLoaded,
        stripe_provider_registered: stripeProviderExists,
        container_error: containerError
      },
      debug_info: {
        all_env_keys: Object.keys(process.env).filter(k => k.includes('STRIPE')).sort()
      }
    })
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  }
}