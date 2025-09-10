import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { addShippingMethodToCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
    
    // Verify cart exists first
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: ["id", "email", "currency_code", "region_id"],
    })
    
    if (!cart) {
      return res.status(404).json({ 
        error: "Cart not found" 
      })
    }
    
    // Use Medusa's proper workflow to add shipping method
    const { result, errors } = await addShippingMethodToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        options: [{
          id: option_id,
          data: data || {}
        }]
      }
    })
    
    if (errors && errors.length > 0) {
      console.error(`[Shipping Methods] Workflow errors:`, errors)
      return res.status(400).json({
        error: (errors[0] as any)?.message || "Failed to add shipping method"
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