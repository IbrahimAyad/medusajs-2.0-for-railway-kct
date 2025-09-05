/**
 * Cache Test Endpoint
 * Verifies Redis cache is working
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const cacheService = req.scope.resolve(Modules.CACHE)
    const cacheKey = "test-cache-key"
    const startTime = Date.now()
    
    // Try to get from cache
    const cached = await cacheService.get(cacheKey)
    
    if (cached) {
      return res.json({
        source: "CACHE HIT",
        time_ms: Date.now() - startTime,
        message: "Redis cache is working! Data served from cache.",
        data: cached
      })
    }
    
    // Store test data in cache
    const testData = {
      timestamp: new Date().toISOString(),
      message: "This data is cached for 60 seconds"
    }
    
    await cacheService.set(cacheKey, testData, 60)
    
    return res.json({
      source: "CACHE MISS",
      time_ms: Date.now() - startTime,
      message: "Data stored in cache. Next request will be served from cache.",
      data: testData
    })
    
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      message: "Cache not configured. Redis might not be connected."
    })
  }
}