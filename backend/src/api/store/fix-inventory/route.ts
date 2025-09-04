/**
 * PUBLIC Inventory Fix Status Check
 * Temporary endpoint for one-time inventory setup
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
    
    // Get all products
    const products = await productModuleService.listProducts({}, { take: 500, relations: ["variants"] })
    
    // Get stock locations
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    const kalamazooStore = stockLocations.find((loc: any) => 
      loc.name?.includes('Kalamazoo') || loc.name?.includes('213 S Kalamazoo')
    )
    
    res.json({
      status: "ready",
      total_products: products.length,
      total_variants: products.reduce((sum: number, p: any) => sum + (p.variants?.length || 0), 0),
      kalamazoo_store: kalamazooStore ? {
        id: kalamazooStore.id,
        name: kalamazooStore.name
      } : null,
      message: "POST to /store/fix-inventory/run to execute setup"
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}