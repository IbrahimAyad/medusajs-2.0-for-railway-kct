import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Simple Vendor Sync Management
 * Uses product metadata to track vendor products
 */

// GET /admin/vendor-sync - Check sync status
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productService: any = req.scope.resolve("productModuleService")
    
    // Count products with Shopify metadata
    const allProducts = await productService.list({}, { take: 1000 })
    
    const vendorProducts = allProducts.filter(p => 
      p.metadata?.shopify_id || 
      p.metadata?.source === "shopify"
    )
    
    const stats = {
      total_products: allProducts.length,
      vendor_products: vendorProducts.length,
      shopify_config: {
        domain: process.env.SHOPIFY_DOMAIN ? "✓ Configured" : "✗ Not set",
        token: process.env.SHOPIFY_ACCESS_TOKEN ? "✓ Configured" : "✗ Not set",
        location: process.env.SHOPIFY_LOCATION_ID ? "✓ Configured" : "✗ Not set"
      },
      last_sync: vendorProducts[0]?.metadata?.last_synced_at || "Never",
      sync_enabled: !!(process.env.SHOPIFY_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN)
    }
    
    res.json(stats)
  } catch (error) {
    console.error("Error getting sync status:", error)
    res.status(500).json({
      error: "Failed to get sync status",
      message: error.message
    })
  }
}

// POST /admin/vendor-sync - Trigger manual sync
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productService: any = req.scope.resolve("productModuleService")
    
    if (!process.env.SHOPIFY_DOMAIN || !process.env.SHOPIFY_ACCESS_TOKEN) {
      return res.status(400).json({
        error: "Shopify configuration missing",
        message: "Please set SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN in Railway"
      })
    }
    
    // Fetch products from Shopify
    console.log(`[Vendor Sync] Fetching from ${process.env.SHOPIFY_DOMAIN}...`)
    
    const shopifyResponse = await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2024-01/products.json?limit=250`,
      {
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!shopifyResponse.ok) {
      throw new Error(`Shopify API error: ${shopifyResponse.status} ${shopifyResponse.statusText}`)
    }
    
    const shopifyData = await shopifyResponse.json()
    const shopifyProducts = shopifyData.products || []
    
    console.log(`[Vendor Sync] Found ${shopifyProducts.length} products`)
    
    // Process each product
    let created = 0
    let updated = 0
    let skipped = 0
    
    for (const shopifyProduct of shopifyProducts) {
      try {
        // Check if product already exists by shopify_id
        const existingProducts = await productService.list({
          metadata: { shopify_id: shopifyProduct.id.toString() }
        }, { take: 1 })
        
        if (existingProducts.length > 0) {
          // Update existing product's inventory
          const existing = existingProducts[0]
          
          // Update metadata with latest sync info
          await productService.update(existing.id, {
            metadata: {
              ...existing.metadata,
              last_synced_at: new Date().toISOString(),
              shopify_updated_at: shopifyProduct.updated_at,
              vendor_status: "synced"
            }
          })
          
          updated++
        } else {
          // Skip creating new products automatically
          // They should be manually curated first
          skipped++
          
          // Log for reference
          console.log(`[Vendor Sync] New product available: ${shopifyProduct.title} (ID: ${shopifyProduct.id})`)
        }
      } catch (err) {
        console.error(`[Vendor Sync] Error processing ${shopifyProduct.title}:`, err)
      }
    }
    
    res.json({
      success: true,
      message: "Vendor sync completed",
      results: {
        total: shopifyProducts.length,
        created,
        updated,
        skipped,
        note: `${skipped} new products available for curation`
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("[Vendor Sync] Error:", error)
    res.status(500).json({
      error: "Sync failed",
      message: error.message
    })
  }
}