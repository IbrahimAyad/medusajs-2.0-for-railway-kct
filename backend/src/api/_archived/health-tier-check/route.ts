/**
 * Health check with tier system status
 * Completely public endpoint - no auth required
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// This is a root-level endpoint outside of store/admin paths
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Quick check of tier system
    const products = await productModuleService.listProducts({
      take: 5,
      relations: ['variants']
    })
    
    const tierCheck = products.map(p => ({
      title: p.title?.substring(0, 50),
      has_tier: !!p.metadata?.tier,
      tier: p.metadata?.tier || "NOT_MAPPED"
    }))
    
    res.json({
      status: "healthy",
      tier_system: {
        sample_products: tierCheck,
        ready: tierCheck.some(p => p.has_tier)
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    res.json({
      status: "healthy",
      tier_system: {
        error: "Could not check products",
        message: error.message
      },
      timestamp: new Date().toISOString()
    })
  }
}