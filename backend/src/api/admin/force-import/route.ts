import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Force Import - Direct database insertion bypassing all workflows
 * This WILL work because it doesn't use broken services
 */

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Get the database connection directly
    const manager = req.scope.resolve("manager") as any
    
    const products = [
      {
        id: `prod_${Date.now()}_1`,
        handle: "mens-suit-m404sk-03",
        title: "2 PC Double Breasted Solid Suit",
        description: "Versatile charcoal gray double-breasted suit",
        status: "published",
        thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg",
        metadata: { shopify_id: "9776181510457", vendor: "Tazzio" }
      },
      {
        id: `prod_${Date.now()}_2`,
        handle: "mens-suit-m341sk-06", 
        title: "2 PC Satin Shawl Collar Suit",
        description: "Rich burgundy suit with satin shawl collar",
        status: "published",
        thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg",
        metadata: { shopify_id: "9736048738617", vendor: "Tazzio" }
      }
    ]

    const results = []
    
    // Use raw SQL to bypass all Medusa services
    for (const product of products) {
      try {
        // Insert product directly into database
        await manager.query(
          `INSERT INTO product (id, handle, title, description, status, thumbnail, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW(), NOW())
           ON CONFLICT (handle) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           updated_at = NOW()`,
          [
            product.id,
            product.handle,
            product.title,
            product.description,
            product.status,
            product.thumbnail,
            JSON.stringify(product.metadata)
          ]
        )
        
        // Add some basic variants
        const sizes = ['38R', '40R', '42R', '44R']
        const basePrice = product.handle.includes('m404') ? 25000 : 17499 // Price in cents
        
        for (const size of sizes) {
          const variantId = `variant_${product.id}_${size}`
          await manager.query(
            `INSERT INTO product_variant (id, product_id, title, sku, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (sku) DO NOTHING`,
            [
              variantId,
              product.id,
              size,
              `${product.handle.split('-').pop()}-${size}`
            ]
          )
          
          // Add price
          await manager.query(
            `INSERT INTO product_variant_price (id, variant_id, amount, currency_code, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [
              `price_${variantId}`,
              variantId,
              basePrice,
              'usd'
            ]
          )
        }
        
        results.push({ 
          success: true, 
          product: product.title,
          message: `Created with ${sizes.length} variants`
        })
        
      } catch (error) {
        results.push({ 
          success: false, 
          product: product.title, 
          error: error.message 
        })
      }
    }
    
    res.json({
      message: "Force import completed",
      results,
      note: "Check admin panel - products should appear now"
    })
    
  } catch (error) {
    console.error("Force import error:", error)
    res.status(500).json({
      error: "Force import failed",
      message: error.message,
      suggestion: "Try the direct SQL approach instead"
    })
  }
}

// GET endpoint to test if this route is accessible
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Force import endpoint ready",
    usage: "POST to this endpoint to force import products",
    warning: "This bypasses all Medusa workflows and directly inserts into database"
  })
}