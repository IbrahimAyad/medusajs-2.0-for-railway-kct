import { MedusaContainer } from '@medusajs/framework/types'
import { StripeProviderService } from '../services/stripe-provider'

export default async (container: MedusaContainer): Promise<void> => {
  try {
    const logger = container.resolve('logger')
    
    // Get Stripe configuration from environment
    const stripeApiKey = process.env.STRIPE_API_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeApiKey) {
      logger.warn('[StripeLoader] Stripe API key not found, skipping Stripe provider registration')
      return
    }

    logger.info('[StripeLoader] Registering custom Stripe payment provider...')

    // Register the Stripe provider service in the container
    container.register({
      stripe: {
        resolve: () => new StripeProviderService(container, {
          apiKey: stripeApiKey,
          webhookSecret: stripeWebhookSecret,
          capture: true,
          automatic_payment_methods: true,
          payment_description: 'Order from KCT Menswear'
        })
      }
    })

    // Also register as stripeProvider for fallback access
    container.register({
      stripeProvider: {
        resolve: () => container.resolve('stripe')
      }
    })

    logger.info('[StripeLoader] ✅ Custom Stripe payment provider registered successfully')
    
    // Verify registration
    try {
      const stripeService = container.resolve('stripe')
      logger.info('[StripeLoader] ✅ Stripe service verification successful:', {
        identifier: StripeProviderService.identifier,
        hasService: !!stripeService
      })
    } catch (verificationError) {
      logger.error('[StripeLoader] ❌ Stripe service verification failed:', verificationError)
    }

  } catch (error) {
    const logger = container.resolve('logger')
    logger.error('[StripeLoader] ❌ Failed to register Stripe provider:', error)
    throw error
  }
}