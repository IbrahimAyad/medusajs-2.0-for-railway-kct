import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  IPaymentModuleService,
  ICartModuleService
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { cart_id } = req.body

  if (!cart_id) {
    return res.status(400).json({ 
      error: "cart_id is required" 
    })
  }

  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
  const cartService = req.scope.resolve<ICartModuleService>(Modules.CART)

  try {
    // Get cart
    const cart = await cartService.retrieveCart(cart_id)
    
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }

    // Create payment collection
    const paymentCollection = await paymentService.createPaymentCollections({
      cart_id: cart.id,
      region_id: cart.region_id,
      currency_code: cart.currency_code || "usd",
      amount: cart.total || 0
    })

    // Try different provider ID formats based on research
    const providerFormats = [
      "stripe",           // Standard format
      "stripe_stripe",    // Format mentioned in docs for webhooks
      "pp_stripe",        // Legacy format
      "pp_stripe_stripe", // Full legacy format
    ]

    let paymentSession = null
    let workingProvider = null
    let lastError = null

    for (const providerId of providerFormats) {
      try {
        console.log(`Attempting to create payment session with provider: ${providerId}`)
        
        paymentSession = await paymentService.createPaymentSession({
          payment_collection_id: paymentCollection.id,
          provider_id: providerId,
          currency_code: cart.currency_code || "usd",
          amount: cart.total || 0,
          data: {
            cart_id: cart.id,
            customer_email: cart.email
          }
        })

        workingProvider = providerId
        console.log(`✅ Payment session created successfully with provider: ${providerId}`)
        break
      } catch (error) {
        console.log(`❌ Provider ${providerId} failed:`, error.message)
        lastError = error
        continue
      }
    }

    if (!paymentSession) {
      // Try to list available providers
      try {
        const providers = await paymentService.listPaymentProviders()
        console.error("Available payment providers:", providers)
        
        return res.status(500).json({ 
          error: "No payment provider available",
          message: lastError?.message || "Failed to create payment session",
          available_providers: providers?.map(p => p.id) || [],
          tried_providers: providerFormats
        })
      } catch (listError) {
        return res.status(500).json({ 
          error: "Payment initialization failed",
          message: lastError?.message || "Failed to create payment session",
          tried_providers: providerFormats
        })
      }
    }

    // Update cart metadata with payment info
    await cartService.updateCarts(cart.id, {
      metadata: {
        ...cart.metadata,
        payment_collection_id: paymentCollection.id,
        payment_session_id: paymentSession.id,
        payment_provider: workingProvider
      }
    })

    return res.json({
      success: true,
      payment_collection_id: paymentCollection.id,
      payment_session_id: paymentSession.id,
      provider_id: workingProvider,
      message: "Payment initialized successfully"
    })

  } catch (error) {
    console.error("Payment initialization error:", error)
    return res.status(500).json({ 
      error: "Payment initialization failed",
      message: error.message,
      details: error
    })
  }
}