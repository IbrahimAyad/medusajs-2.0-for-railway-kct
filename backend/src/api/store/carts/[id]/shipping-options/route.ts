import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Get available shipping options for a cart
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cartId } = req.params
  
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get cart details
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id",
        "region_id",
        "shipping_address.*"
      ],
    })
    
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }
    
    // Get shipping options for the region
    const { data: shippingOptions } = await query.graph({
      entity: "shipping_option",
      fields: [
        "id",
        "name",
        "price_type",
        "provider_id",
        "data",
        "amount",
        "service_zone_id",
        "shipping_profile_id"
      ],
    })
    
    // For now, return standard shipping options
    // In production, filter by region and other criteria
    const availableOptions = [
      {
        id: "so_01K3PJN8J3PWYFPEV2EN8H39NQ",
        name: "Standard Shipping",
        amount: 500, // $5.00
        price_type: "flat",
        provider_id: "manual_manual"
      },
      {
        id: "so_01K3PJN8J4BEZBMBMVYKDC98KD",
        name: "Express Shipping",
        amount: 1000, // $10.00
        price_type: "flat",
        provider_id: "manual_manual"
      },
      {
        id: "so_01K3S6BKMKFTYS3ASAC3HBCSD5",
        name: "Free Shipping",
        amount: 0,
        price_type: "flat",
        provider_id: "manual_manual"
      }
    ]
    
    return res.json({
      shipping_options: availableOptions
    })
    
  } catch (error: any) {
    console.error(`[Shipping Options] Error:`, error)
    return res.status(500).json({
      error: error.message || "Failed to get shipping options"
    })
  }
}