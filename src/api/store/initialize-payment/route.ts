import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  ICartModuleService,
  IPaymentModuleService,
  IRegionModuleService
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

  const cartService = req.scope.resolve<ICartModuleService>(Modules.CART)
  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
  const regionService = req.scope.resolve<IRegionModuleService>(Modules.REGION)

  try {
    // Get cart details
    const cart = await cartService.retrieveCart(cart_id, {
      relations: ["shipping_address", "billing_address", "items"]
    })

    if (!cart) {
      return res.status(404).json({ 
        error: "Cart not found" 
      })
    }

    // Get region for currency
    const region = await regionService.retrieveRegion(cart.region_id)

    // Check if payment collection already exists
    let paymentCollectionId = cart.metadata?.payment_collection_id as string

    if (!paymentCollectionId) {
      // Create payment collection
      const paymentCollection = await paymentService.createPaymentCollections({
        cart_id: cart.id,
        region_id: cart.region_id,
        currency_code: cart.currency_code || region.currency_code || "usd",
        amount: cart.total || 0
      })
      
      paymentCollectionId = paymentCollection.id

      // Update cart with payment collection ID
      await cartService.updateCarts(cart.id, {
        metadata: {
          ...cart.metadata,
          payment_collection_id: paymentCollectionId
        }
      })
    }

    // Try different provider ID formats
    const providerIds = [
      "stripe",           // Medusa v2 format
      "pp_stripe",        // Alternative format
      "pp_stripe_stripe", // Legacy format
      "payment_stripe"    // Another possible format
    ]

    let paymentSession = null
    let workingProviderId = null

    // Try each provider ID until one works
    for (const providerId of providerIds) {
      try {
        paymentSession = await paymentService.createPaymentSession({
          payment_collection_id: paymentCollectionId,
          provider_id: providerId,
          currency_code: cart.currency_code || region.currency_code || "usd",
          amount: cart.total || 0,
          data: {
            cart_id: cart.id
          }
        })
        
        workingProviderId = providerId
        console.log(`Payment session created with provider: ${providerId}`)
        break
      } catch (error) {
        console.log(`Provider ${providerId} failed:`, error.message)
        continue
      }
    }

    if (!paymentSession) {
      // If no provider worked, list available providers
      const providers = await paymentService.listPaymentProviders()
      console.error("Available payment providers:", providers)
      
      return res.status(500).json({ 
        error: "Failed to create payment session with any provider",
        available_providers: providers.map(p => p.id),
        tried_providers: providerIds
      })
    }

    // Update cart with payment session info
    await cartService.updateCarts(cart.id, {
      metadata: {
        ...cart.metadata,
        payment_session_id: paymentSession.id,
        payment_provider_id: workingProviderId
      }
    })

    return res.json({
      success: true,
      payment_collection_id: paymentCollectionId,
      payment_session_id: paymentSession.id,
      provider_id: workingProviderId,
      cart_id: cart.id
    })

  } catch (error) {
    console.error("Payment initialization error:", error)
    return res.status(500).json({ 
      error: error.message || "Failed to initialize payment",
      details: error
    })
  }
}