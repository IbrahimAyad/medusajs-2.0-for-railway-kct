import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Get order details by ID
 * GET /store/orders/{id}
 * 
 * Returns complete order information for display on success page
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: orderId } = req.params
  
  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: "Order ID is required"
    })
  }

  try {
    console.log(`[Order Details] Fetching order: ${orderId}`)
    
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    const { data: [order] } = await query.graph({
      entity: "order",
      filters: { id: orderId },
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
        "payment_status",
        "fulfillment_status",
        "metadata.*",
        "customer.*"
      ]
    })
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      })
    }
    
    console.log(`[Order Details] Successfully retrieved order: ${orderId}`)
    
    return res.json({
      success: true,
      order
    })
    
  } catch (error: any) {
    console.error(`[Order Details] Error fetching order ${orderId}:`, error)
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch order"
    })
  }
}