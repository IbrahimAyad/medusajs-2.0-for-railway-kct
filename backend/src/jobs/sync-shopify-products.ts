import { MedusaContainer } from "@medusajs/framework/types"
import { SHOPIFY_DOMAIN, SHOPIFY_ACCESS_TOKEN } from "../lib/constants"

export default async function syncShopifyProducts(container: MedusaContainer) {
  console.log("[Shopify Sync Job] Starting product sync...")
  
  if (!SHOPIFY_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
    console.error("[Shopify Sync Job] Missing Shopify credentials")
    return {
      success: false,
      message: "Missing Shopify configuration"
    }
  }
  
  try {
    // Log the sync attempt
    console.log(`[Shopify Sync Job] Syncing from ${SHOPIFY_DOMAIN}`)
    
    // The medusa-source-shopify plugin should handle the actual sync
    // This job just ensures it runs
    
    const eventBus: any = container.resolve("eventBusService")
    if (eventBus) {
      await eventBus.emit("shopify.sync.start", {
        domain: SHOPIFY_DOMAIN,
        timestamp: new Date().toISOString()
      })
    }
    
    return {
      success: true,
      message: `Sync initiated for ${SHOPIFY_DOMAIN}`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error("[Shopify Sync Job] Error:", error)
    return {
      success: false,
      message: error.message
    }
  }
}

export const config = {
  name: "sync-shopify-products",
  schedule: "0 2 * * 3,6", // Wed & Sat at 2 AM
}