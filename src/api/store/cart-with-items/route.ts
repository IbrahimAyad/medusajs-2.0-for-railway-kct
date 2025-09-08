import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Simplified cart operations that work without payment provider
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const { action, ...data } = req.body
  const cartService = req.scope.resolve<ICartModuleService>(Modules.CART)

  try {
    switch (action) {
      case "create": {
        const cart = await cartService.createCarts({
          region_id: data.region_id || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD",
          currency_code: data.currency_code || "usd",
          email: data.email,
          metadata: {
            // Skip payment initialization for now
            payment_pending: true
          }
        })
        
        return res.json({ 
          success: true,
          cart_id: cart.id,
          message: "Cart created successfully"
        })
      }

      case "add-item": {
        const { cart_id, variant_id, quantity = 1 } = data
        
        // Add item without payment check
        const updatedCart = await cartService.addLineItems(cart_id, [
          {
            variant_id,
            quantity,
            unit_price: data.unit_price || 0
          }
        ])

        return res.json({ 
          success: true,
          cart: updatedCart,
          message: "Item added successfully"
        })
      }

      case "update-item": {
        const { cart_id, line_item_id, quantity } = data
        
        const updatedCart = await cartService.updateLineItems(cart_id, [
          {
            id: line_item_id,
            quantity
          }
        ])

        return res.json({ 
          success: true,
          cart: updatedCart
        })
      }

      case "remove-item": {
        const { cart_id, line_item_id } = data
        
        await cartService.deleteLineItems(cart_id, [line_item_id])
        const cart = await cartService.retrieveCart(cart_id)

        return res.json({ 
          success: true,
          cart
        })
      }

      case "get": {
        const { cart_id } = data
        const cart = await cartService.retrieveCart(cart_id, {
          relations: ["items", "shipping_address"]
        })

        return res.json({ 
          success: true,
          cart
        })
      }

      default:
        return res.status(400).json({ 
          success: false,
          error: `Unknown action: ${action}` 
        })
    }
  } catch (error) {
    console.error("Cart operation error:", error)
    return res.status(500).json({ 
      success: false,
      error: error.message || "Cart operation failed"
    })
  }
}