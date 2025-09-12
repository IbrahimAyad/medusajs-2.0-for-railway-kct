import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Check if an order exists for a given cart ID
 * GET /store/orders/check?cart_id=cart_xxx
 * 
 * Used by frontend to poll for order creation after payment
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.query.cart_id as string
  
  if (!cartId) {
    return res.status(400).json({
      success: false,
      error: "cart_id parameter is required"
    })
  }

  try {
    console.log(`[Order Check] Checking for order with cart_id: ${cartId}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // First, try to find order by metadata.cart_id
    try {
      const { data: orders } = await query.graph({
        entity: "order",
        filters: {
          metadata: {
            cart_id: cartId
          }
        },
        fields: [
          "id",
          "display_id",
          "email",
          "currency_code",
          "total",
          "subtotal",
          "tax_total",
          "shipping_total",
          "created_at",
          "items.*",
          "items.product.*",
          "items.variant.*",
          "shipping_address.*",
          "billing_address.*",
          "shipping_methods.*",
          "metadata.*"
        ]
      })
      
      if (orders && orders.length > 0) {
        console.log(`[Order Check] Found order: ${orders[0].id}`)
        return res.json({
          success: true,
          order: orders[0]
        })
      }
    } catch (metadataError) {
      console.log("[Order Check] Could not search by metadata, trying alternative method")
    }
    
    // Alternative: Check if cart was recently completed
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: ["id", "completed_at", "metadata.*"]
    })
    
    if (cart?.completed_at) {
      console.log(`[Order Check] Cart ${cartId} is marked as completed`)
      // Cart is completed but order not found by metadata
      // This might happen if order creation is still processing
      return res.json({
        success: false,
        processing: true,
        message: "Order is being created, please wait..."
      })
    }
    
    console.log(`[Order Check] No order found for cart_id: ${cartId}`)
    return res.json({
      success: false,
      order: null,
      message: "Order not found yet"
    })
    
  } catch (error: any) {
    console.error("[Order Check] Error:", error)
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to check order status"
    })
  }
}