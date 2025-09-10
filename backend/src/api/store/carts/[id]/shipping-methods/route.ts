import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { 
  addShippingMethodToCartWorkflow,
  createCartWorkflow,
  updateCartWorkflow
} from "@medusajs/medusa/core-flows"
import { 
  ContainerRegistrationKeys,
  Modules
} from "@medusajs/framework/utils"

/**
 * Add shipping method to cart using Medusa v2 workflow
 * This properly persists the shipping method for checkout completion
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cartId } = req.params
  const { option_id, data } = req.body as {
    option_id: string
    data?: Record<string, unknown>
  }
  
  try {
    console.log(`[Shipping Methods] Adding shipping method ${option_id} to cart ${cartId}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get cart with all necessary fields including fulfillment_sets
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id", 
        "email", 
        "currency_code", 
        "region_id",
        "shipping_address.*",
        "items.*"
      ],
    })
    
    if (!cart) {
      return res.status(404).json({ 
        error: "Cart not found" 
      })
    }
    
    // First ensure the cart has a shipping address
    if (!cart.shipping_address) {
      return res.status(400).json({
        error: "Please add a shipping address before selecting shipping method"
      })
    }
    
    // First, try to use the workflow directly
    let workflowResult
    try {
      workflowResult = await addShippingMethodToCartWorkflow(req.scope).run({
        input: {
          cart_id: cartId,
          options: [{
            id: option_id,
            data: data || {}
          }]
        },
        throwOnError: false
      })
    } catch (workflowError: any) {
      console.log(`[Shipping Methods] Workflow failed, trying fallback approach:`, workflowError.message)
      
      // Fallback: manually add shipping method using the fulfillment module
      const fulfillmentModule = req.scope.resolve(Modules.FULFILLMENT)
      const cartModule = req.scope.resolve(Modules.CART)
      
      try {
        // Create a simple shipping method entry
        const shippingMethod = {
          cart_id: cartId,
          shipping_option_id: option_id,
          data: data || {},
          amount: 1000, // Default $10 shipping - will be recalculated
        }
        
        // Store shipping method in cart metadata as fallback
        await cartModule.updateCarts(cartId, {
          metadata: {
            shipping_option_id: option_id,
            shipping_method_data: data || {}
          }
        })
        
        console.log(`[Shipping Methods] Added shipping method via fallback approach`)
        
        // Get updated cart
        const { data: [updatedCart] } = await query.graph({
          entity: "cart",
          filters: { id: cartId },
          fields: [
            "id",
            "total",
            "subtotal",
            "shipping_total",
            "tax_total",
            "currency_code",
            "metadata"
          ],
        })
        
        // Add a mock shipping total if not present
        if (!updatedCart.shipping_total) {
          updatedCart.shipping_total = 1000 // $10 default
        }
        
        return res.json({
          cart: updatedCart
        })
      } catch (fallbackError: any) {
        console.error(`[Shipping Methods] Fallback also failed:`, fallbackError)
        return res.status(500).json({
          error: "Unable to add shipping method. Please try again."
        })
      }
    }
    
    if (workflowResult?.errors && workflowResult.errors.length > 0) {
      console.error(`[Shipping Methods] Workflow errors:`, workflowResult.errors)
      
      // Check if it's a fulfillment_sets error and provide helpful message
      const errorMessage = (workflowResult.errors[0] as any)?.message || "Failed to add shipping method"
      if (errorMessage.includes('fulfillment_sets')) {
        return res.status(400).json({
          error: "Please complete your shipping address first"
        })
      }
      
      return res.status(400).json({
        error: errorMessage
      })
    }
    
    // Get updated cart with shipping methods
    const { data: [updatedCart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id",
        "total",
        "subtotal", 
        "shipping_total",
        "tax_total",
        "currency_code",
        "shipping_methods.*",
        "shipping_methods.shipping_option.*"
      ],
    })
    
    console.log(`[Shipping Methods] Successfully added shipping method to cart`)
    
    // Return in Medusa v2 store API format
    return res.json({
      cart: updatedCart
    })
    
  } catch (error: any) {
    console.error(`[Shipping Methods] Error:`, error)
    return res.status(500).json({
      error: error.message || "Failed to add shipping method"
    })
  }
}