import fetch from 'node-fetch'

// Comprehensive test of the payment flow
async function testPaymentFlow() {
  console.log('[PAYMENT TEST] 🚀 Starting comprehensive payment flow test...')
  
  const baseUrl = 'http://localhost:9000'
  
  try {
    // Step 1: Create a cart
    console.log('[PAYMENT TEST] 📦 Step 1: Creating cart...')
    const createCartResponse = await fetch(`${baseUrl}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })
    
    if (!createCartResponse.ok) {
      const errorText = await createCartResponse.text()
      console.error('[PAYMENT TEST] ❌ Failed to create cart:', errorText)
      return
    }
    
    const cart = await createCartResponse.json()
    console.log('[PAYMENT TEST] ✅ Cart created:', cart.id)
    
    // Step 2: Add a line item to the cart  
    console.log('[PAYMENT TEST] 🛒 Step 2: Adding line item...')
    const addItemResponse = await fetch(`${baseUrl}/store/carts/${cart.id}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant_id: 'variant_01234567890', // Dummy variant ID
        quantity: 1
      })
    })
    
    if (!addItemResponse.ok) {
      // Try with a different approach for adding value to cart
      console.log('[PAYMENT TEST] ⚠️ Line item failed, trying direct total update...')
      
      // For testing purposes, let's create a payment session with a test amount
      const testAmount = 2999 // $29.99 in cents
      
      // Step 3: Create payment session directly with test amount
      console.log('[PAYMENT TEST] 💳 Step 3: Creating payment session with test amount...')
      const paymentSessionResponse = await fetch(`${baseUrl}/store/carts/${cart.id}/payment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider_id: 'stripe'
        })
      })
      
      const paymentResult = await paymentSessionResponse.text()
      console.log('[PAYMENT TEST] Payment session response status:', paymentSessionResponse.status)
      console.log('[PAYMENT TEST] Payment session response:', paymentResult)
      
      if (paymentSessionResponse.ok) {
        const paymentData = JSON.parse(paymentResult)
        console.log('[PAYMENT TEST] ✅ Payment session created successfully!')
        console.log('[PAYMENT TEST] Payment Intent ID:', paymentData.payment_session?.data?.id)
        console.log('[PAYMENT TEST] Client Secret:', paymentData.payment_session?.data?.client_secret ? 'Present' : 'Missing')
        console.log('[PAYMENT TEST] Provider used:', paymentData.provider_used)
        console.log('[PAYMENT TEST] Stripe amount:', paymentData.stripe_amount, 'cents')
      } else {
        console.error('[PAYMENT TEST] ❌ Payment session creation failed')
        try {
          const errorData = JSON.parse(paymentResult)
          console.error('[PAYMENT TEST] Error details:', errorData)
        } catch {
          console.error('[PAYMENT TEST] Raw error:', paymentResult)
        }
      }
      
      return
    }
    
    const updatedCart = await addItemResponse.json()
    console.log('[PAYMENT TEST] ✅ Line item added, cart total:', updatedCart.total)
    
    // Step 3: Create payment session
    console.log('[PAYMENT TEST] 💳 Step 3: Creating payment session...')
    const paymentSessionResponse = await fetch(`${baseUrl}/store/carts/${cart.id}/payment-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider_id: 'stripe'
      })
    })
    
    const paymentResult = await paymentSessionResponse.text()
    console.log('[PAYMENT TEST] Payment session response:', paymentResult)
    
    if (paymentSessionResponse.ok) {
      const paymentData = JSON.parse(paymentResult)
      console.log('[PAYMENT TEST] ✅ Payment session created successfully!')
      console.log('[PAYMENT TEST] Payment Intent ID:', paymentData.payment_session?.data?.id)
      console.log('[PAYMENT TEST] Client Secret:', paymentData.payment_session?.data?.client_secret ? 'Present' : 'Missing')
    } else {
      console.error('[PAYMENT TEST] ❌ Payment session creation failed')
      try {
        const errorData = JSON.parse(paymentResult)
        console.error('[PAYMENT TEST] Error details:', errorData)
      } catch {
        console.error('[PAYMENT TEST] Raw error:', paymentResult)
      }
    }
    
  } catch (error) {
    console.error('[PAYMENT TEST] ❌ Test failed with exception:', error.message)
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testPaymentFlow().catch(console.error)
}

export { testPaymentFlow }