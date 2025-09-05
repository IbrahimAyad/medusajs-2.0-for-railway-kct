/**
 * Cache Test Endpoint
 * Tests Redis cache implementation for performance
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
    
    const cacheKey = "test-products-cache"
    const startTime = Date.now()
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      const cacheTime = Date.now() - startTime
      return res.json({
        source: "cache",
        cache_time_ms: cacheTime,
        products_count: cached.length,
        message: "Data served from Redis cache",
        data: cached
      })
    }
    
    // If not in cache, fetch from database
    const dbStartTime = Date.now()
    const products = await productModuleService.listProducts(
      { limit: 10 },
      { 
        relations: ["variants", "images", "options"],
        take: 10
      }
    )
    const dbTime = Date.now() - dbStartTime
    
    // Store in cache for next request
    await cacheService.set(cacheKey, products, 60) // 60 second TTL
    
    return res.json({
      source: "database",
      database_time_ms: dbTime,
      products_count: products.length,
      message: "Data fetched from database and cached for 60 seconds",
      data: products
    })
    
  } catch (error: any) {
    console.error("Cache test error:", error)
    res.status(500).json({
      error: error.message,
      message: "Cache test failed - Redis might not be configured"
    })
  }
}