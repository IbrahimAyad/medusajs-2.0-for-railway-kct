import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  createCartWorkflow,
  addToCartWorkflow,
  updateLineItemInCartWorkflow
} from "@medusajs/medusa/core-flows"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { action, ...data } = req.body

  try {
    switch (action) {
      case "create": {
        // Use Medusa's official workflow to create cart
        const { result } = await createCartWorkflow(req.scope).run({
          input: {
            region_id: data.region_id || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD",
            currency_code: data.currency_code || "usd",
            email: data.email,
            sales_channel_id: data.sales_channel_id,
            customer_id: data.customer_id
          }
        })
        
        return res.json({
          success: true,
          cart: result
        })
      }
      
      case "add_item": {
        // Use Medusa's official workflow to add items
        const { result } = await addToCartWorkflow(req.scope).run({
          input: {
            items: [{
              cart_id: data.cart_id,
              variant_id: data.variant_id,
              quantity: data.quantity || 1
            }]
          }
        })
        
        return res.json({
          success: true,
          cart: result
        })
      }
      
      case "update_item": {
        // Update item quantity
        const { result } = await updateLineItemInCartWorkflow(req.scope).run({
          input: {
            cart_id: data.cart_id,
            item_id: data.item_id,
            quantity: data.quantity
          }
        })
        
        return res.json({
          success: true,
          cart: result
        })
      }
      
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action. Use: create, add_item, or update_item"
        })
    }
  } catch (error) {
    console.error("Cart workflow error:", error)
    return res.status(400).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    })
  }
}