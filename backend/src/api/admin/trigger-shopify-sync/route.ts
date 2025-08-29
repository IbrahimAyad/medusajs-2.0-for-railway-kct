import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Manual trigger for Shopify product sync
 * POST /admin/trigger-shopify-sync
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("[Shopify Sync] Manual sync triggered")
    
    // The Shopify plugin should handle this automatically
    // but we need to trigger it manually
    
    // Get the Shopify service if available
    const shopifyService = req.scope.resolve("shopifyService") || 
                          req.scope.resolve("shopify") ||
                          req.scope.resolve("medusa-source-shopify")
    
    if (shopifyService && typeof shopifyService.syncProducts === 'function') {
      console.log("[Shopify Sync] Found Shopify service, triggering sync...")
      await shopifyService.syncProducts()
      
      return res.json({
        success: true,
        message: "Shopify sync triggered successfully",
        timestamp: new Date().toISOString()
      })
    }
    
    // If no direct service, try to trigger via event
    const eventBus = req.scope.resolve("eventBusService")
    if (eventBus) {
      console.log("[Shopify Sync] Emitting sync event...")
      await eventBus.emit("shopify.sync", {
        type: "products",
        triggered_by: "manual",
        timestamp: new Date().toISOString()
      })
      
      return res.json({
        success: true,
        message: "Shopify sync event emitted",
        note: "Check logs for sync progress",
        timestamp: new Date().toISOString()
      })
    }
    
    // Fallback response
    res.json({
      success: false,
      message: "Shopify sync service not found",
      info: "The sync may run automatically on schedule (Wed & Sat at 2 AM)",
      troubleshooting: [
        "1. Check if SHOPIFY_DOMAIN is set in Railway env vars",
        "2. Check if SHOPIFY_ACCESS_TOKEN is set in Railway env vars", 
        "3. Check if SHOPIFY_LOCATION_ID is set in Railway env vars",
        "4. Check Railway logs for any Shopify plugin errors"
      ]
    })
  } catch (error) {
    console.error("[Shopify Sync] Error:", error)
    res.status(500).json({ 
      error: "Failed to trigger sync",
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Check sync status
 * GET /admin/trigger-shopify-sync
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productService = req.scope.resolve("productModuleService")
    
    // Count products with Shopify metadata
    let shopifyProductCount = 0
    let totalProductCount = 0
    
    try {
      // This is a simple check - may need adjustment based on actual API
      const products = await productService.list({}, { take: 1000 })
      totalProductCount = products.length
      
      // Count products from Shopify
      shopifyProductCount = products.filter(p => 
        p.metadata?.source === "shopify" || 
        p.metadata?.shopify_id
      ).length
    } catch (e) {
      console.log("Could not count products:", e.message)
    }
    
    res.json({
      status: "ready",
      shopify_products: shopifyProductCount,
      total_products: totalProductCount,
      shopify_config: {
        domain: process.env.SHOPIFY_DOMAIN ? "✓ Set" : "✗ Missing",
        token: process.env.SHOPIFY_ACCESS_TOKEN ? "✓ Set" : "✗ Missing",
        location: process.env.SHOPIFY_LOCATION_ID ? "✓ Set" : "✗ Missing"
      },
      sync_schedule: "Wednesdays and Saturdays at 2 AM",
      manual_sync_endpoint: "POST /admin/trigger-shopify-sync"
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to check status",
      message: error.message 
    })
  }
}