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
  const { action, ...data } = req.body

  const cartService = req.scope.resolve<ICartModuleService>(Modules.CART)
  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
  const regionService = req.scope.resolve<IRegionModuleService>(Modules.REGION)

  try {
    switch (action) {
      case "createCart": {
        // Get region for currency
        const regionId = data.region_id || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"
        const region = await regionService.retrieveRegion(regionId)
        
        // Create cart
        const cart = await cartService.createCarts({
          region_id: regionId,
          currency_code: region.currency_code || "usd",
          email: data.email,
          shipping_address: data.shipping_address,
          metadata: data.metadata || {}
        })

        // Create payment collection for the cart
        const paymentCollection = await paymentService.createPaymentCollections({
          cart_id: cart.id,
          region_id: cart.region_id,
          currency_code: cart.currency_code,
          amount: 0 // Will be updated when items are added
        })

        // Try to initialize payment session with correct provider ID
        const providerIds = ["stripe", "pp_stripe", "pp_stripe_stripe"]
        let paymentSession = null
        
        for (const providerId of providerIds) {
          try {
            paymentSession = await paymentService.createPaymentSession({
              payment_collection_id: paymentCollection.id,
              provider_id: providerId,
              currency_code: cart.currency_code,
              amount: 0,
              data: {}
            })
            
            // Update cart with payment info
            await cartService.updateCarts(cart.id, {
              metadata: {
                ...cart.metadata,
                payment_collection_id: paymentCollection.id,
                payment_session_id: paymentSession.id,
                payment_provider_id: providerId
              }
            })
            
            console.log(`Payment session created with provider: ${providerId}`)
            break
          } catch (sessionError) {
            console.log(`Provider ${providerId} failed:`, sessionError.message)
            continue
          }
        }
        
        if (!paymentSession) {
          console.error("Could not create payment session with any provider")
          // Continue without payment session - it can be created later
        }

        return res.json({
          cart: {
            ...cart,
            payment_collection_id: paymentCollection.id
          }
        })
      }

      case "addLineItem": {
        const { cart_id, variant_id, quantity = 1 } = data
        
        // Add item to cart
        const updatedCart = await cartService.addLineItems(cart_id, [
          {
            variant_id,
            quantity,
            unit_price: data.unit_price
          }
        ])

        // Update payment collection amount if exists
        const cart = await cartService.retrieveCart(cart_id)
        if (cart.metadata?.payment_collection_id) {
          await paymentService.updatePaymentCollections(
            cart.metadata.payment_collection_id,
            {
              amount: cart.total || 0
            }
          )
        }

        return res.json({ cart: updatedCart })
      }

      case "updateLineItem": {
        const { cart_id, line_item_id, quantity } = data
        
        const updatedCart = await cartService.updateLineItems(cart_id, [
          {
            id: line_item_id,
            quantity
          }
        ])

        // Update payment collection amount
        const cart = await cartService.retrieveCart(cart_id)
        if (cart.metadata?.payment_collection_id) {
          await paymentService.updatePaymentCollections(
            cart.metadata.payment_collection_id,
            {
              amount: cart.total || 0
            }
          )
        }

        return res.json({ cart: updatedCart })
      }

      case "deleteLineItem": {
        const { cart_id, line_item_id } = data
        
        await cartService.deleteLineItems(cart_id, [line_item_id])
        const cart = await cartService.retrieveCart(cart_id)

        // Update payment collection amount
        if (cart.metadata?.payment_collection_id) {
          await paymentService.updatePaymentCollections(
            cart.metadata.payment_collection_id,
            {
              amount: cart.total || 0
            }
          )
        }

        return res.json({ cart })
      }

      default:
        return res.status(400).json({ 
          error: `Unknown action: ${action}` 
        })
    }
  } catch (error) {
    console.error("Cart operation error:", error)
    return res.status(500).json({ 
      error: error.message || "Cart operation failed",
      details: error
    })
  }
}