// Stripe Configuration
// IMPORTANT: Update these keys with your actual Stripe keys
// Last updated: 2024-09-11 - Using correct account key

// Get keys from environment or use defaults
// The publishable key MUST match your Stripe account
// CORRECT KEY for this account (verified working key)
export const STRIPE_PUBLISHABLE_KEY = 
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_live_51RAMT2CHc12x7sCzv9MxCfz8HBj76Js5MiRCa0F0o3xVOJJ0LS7pRNhDxIJZf5mQQBW6vD5h3cQzI0B5vhLSl6Y200YY9iXR7h'

// For testing, you can use Stripe test keys
// Test publishable key format: pk_test_...
// Test secret key format: sk_test_...
export const IS_TEST_MODE = STRIPE_PUBLISHABLE_KEY.startsWith('pk_test')

// Validate key format
export const isValidStripeKey = (key: string) => {
  if (!key) return false
  
  // Publishable keys start with pk_live_ or pk_test_
  if (key.startsWith('pk_')) {
    return key.startsWith('pk_live_') || key.startsWith('pk_test_')
  }
  
  // Secret keys start with sk_live_ or sk_test_
  if (key.startsWith('sk_')) {
    return key.startsWith('sk_live_') || key.startsWith('sk_test_')
  }
  
  return false
}

// Log key validation for debugging
if (typeof window !== 'undefined') {
  console.log('Stripe Configuration:', {
    hasPublishableKey: !!STRIPE_PUBLISHABLE_KEY,
    keyPrefix: STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...',
    isTestMode: IS_TEST_MODE,
    isValid: isValidStripeKey(STRIPE_PUBLISHABLE_KEY)
  })
  
  if (!isValidStripeKey(STRIPE_PUBLISHABLE_KEY)) {
    console.error('⚠️ Invalid Stripe publishable key format. Please check your environment variables.')
  }
}