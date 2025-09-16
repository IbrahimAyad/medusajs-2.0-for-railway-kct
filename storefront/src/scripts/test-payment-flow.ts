import { medusa } from "../../src/lib/medusa/config"

async function testPaymentFlow() {
  try {
    console.log("🧪 Testing complete payment flow...")
    
    // Step 1: Create a cart
    console.log("1️⃣ Creating cart...")
    const cart = await medusa.store.cart.create({
      currency_code: "usd",
      region_id: "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"
    })
    console.log("✅ Cart created:", cart.cart.id)
    
    // Step 2: Add a product to cart (using a known product ID)
    console.log("2️⃣ Adding product to cart...")
    const lineItem = await medusa.store.cart.createLineItem(cart.cart.id, {
      variant_id: "variant_01K39MWPN99CDS92XFWC5DBMBX", // Classic White Shirt variant
      quantity: 1
    })
    console.log("✅ Product added to cart")
    
    // Step 3: Fetch updated cart with total
    console.log("3️⃣ Fetching cart with total...")
    const updatedCart = await medusa.store.cart.retrieve(cart.cart.id)
    console.log("Cart total:", updatedCart.cart.total)
    console.log("Cart total type:", typeof updatedCart.cart.total)
    console.log("Cart total value:", JSON.stringify(updatedCart.cart.total, null, 2))
    
    // Step 4: Create payment session
    console.log("4️⃣ Creating payment session...")
    const paymentCollection = await medusa.store.payment.initiatePaymentSession(
      updatedCart.cart,
      {
        provider_id: "pp_stripe_stripe"
      }
    )
    
    console.log("✅ Payment session created!")
    console.log("Payment collection ID:", paymentCollection.payment_collection.id)
    console.log("Payment session data:", JSON.stringify(paymentCollection.payment_collection.payment_sessions?.[0]?.data, null, 2))
    
    // Check for client secret
    const session = paymentCollection.payment_collection.payment_sessions?.[0]
    if (session?.data?.client_secret) {
      console.log("✅ Client secret present:", session.data.client_secret.substring(0, 20) + "...")
    } else {
      console.log("❌ No client secret in payment session")
    }
    
    console.log("\n🎉 Payment flow test completed successfully!")
    
  } catch (error: any) {
    console.error("❌ Test failed:", error.message)
    console.error("Error details:", error.response?.data || error)
  }
}

// Run the test
testPaymentFlow()