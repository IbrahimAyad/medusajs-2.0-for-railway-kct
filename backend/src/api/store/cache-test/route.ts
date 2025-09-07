/**
 * Cache Test Endpoint - Verify caching is working
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const cacheService = req.scope.resolve(Modules.CACHE)
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    const cacheKey = "cache-test-products"
    const startTime = Date.now()
    
    // Try to get from cache first
    let cached = await cacheService.get(cacheKey)
    
    if (cached) {
      return res.json({
        source: "cache",
        message: "Data served from cache (fast!)",
        response_time_ms: Date.now() - startTime,
        ttl: "60 seconds",
        data: cached
      })
    }
    
    // Not in cache, fetch from database
    const products = await productModuleService.listProducts(
      {},
      { 
        select: ["id", "title", "handle"],
        take: 5 
      }
    )
    
    // Store in cache for 60 seconds
    await cacheService.set(cacheKey, products, 60)
    
    res.json({
      source: "database",
      message: "Data fetched from database and cached for 60 seconds",
      response_time_ms: Date.now() - startTime,
      ttl: "60 seconds",
      data: products,
      note: "Next request will be served from cache (much faster!)"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      cache_status: "Cache module may not be configured"
    })
  }
}
