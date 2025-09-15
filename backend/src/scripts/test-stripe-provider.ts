import { StripeProviderService } from '../services/stripe-provider'

// Test script to verify custom Stripe provider
async function testStripeProvider() {
  console.log('[TEST] Testing custom Stripe provider...')
  
  const stripeKey = process.env.STRIPE_API_KEY
  if (!stripeKey) {
    console.error('[TEST] ❌ Stripe API key not found')
    return
  }
  
  try {
    // Create mock container
    const mockContainer = {
      logger: {
        info: (...args: any[]) => console.log('[TEST]', ...args),
        warn: (...args: any[]) => console.warn('[TEST]', ...args),
        error: (...args: any[]) => console.error('[TEST]', ...args),
      }
    }
    
    const stripeProvider = new StripeProviderService(mockContainer, {
      apiKey: stripeKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      capture: true,
      automatic_payment_methods: true,
      payment_description: 'Test payment'
    })
    
    console.log('[TEST] ✅ Stripe provider created successfully')
    
    // Test payment intent creation
    const paymentResponse = await stripeProvider.initiatePayment({
      amount: 2999, // $29.99
      currency_code: 'usd',
      context: {}
    })
    
    if ('error' in paymentResponse) {
      console.error('[TEST] ❌ Payment initiation failed:', paymentResponse.error)
    } else {
      console.log('[TEST] ✅ Payment intent created:', paymentResponse.id)
      console.log('[TEST] Client secret:', paymentResponse.data?.client_secret ? 'Present' : 'Missing')
    }
    
  } catch (error) {
    console.error('[TEST] ❌ Test failed:', error.message)
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testStripeProvider().catch(console.error)
}

export { testStripeProvider }