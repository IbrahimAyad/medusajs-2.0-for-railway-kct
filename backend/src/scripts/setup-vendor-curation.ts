/**
 * Script to set up vendor product curation
 * Run this after Shopify products have synced
 * 
 * Usage: npx tsx src/scripts/setup-vendor-curation.ts
 */

import { initialize } from "@medusajs/framework"

async function setupVendorCuration() {
  const { container } = await initialize()
  
  try {
    console.log("Setting up vendor product curation...")
    
    const productService = container.resolve("product")
    const query = container.resolve("query")
    
    // Find all Shopify products
    const { data: shopifyProducts } = await query.graph({
      entity: "product",
      fields: ["id", "title", "metadata", "status"],
      filters: {
        metadata: {
          source: "shopify"
        }
      },
      pagination: {
        pageSize: 1000
      }
    })
    
    console.log(`Found ${shopifyProducts.length} Shopify products`)
    
    // Tag products that don't have curation status
    let tagged = 0
    for (const product of shopifyProducts) {
      if (!product.metadata?.curation_status) {
        await productService.update(product.id, {
          status: "draft", // Set to draft for review
          metadata: {
            ...product.metadata,
            curation_status: "pending",
            import_date: new Date().toISOString(),
            needs_review: true
          }
        })
        tagged++
        console.log(`Tagged: ${product.title}`)
      }
    }
    
    console.log(`\n✅ Setup complete!`)
    console.log(`- Total Shopify products: ${shopifyProducts.length}`)
    console.log(`- Newly tagged for review: ${tagged}`)
    console.log(`- Already tagged: ${shopifyProducts.length - tagged}`)
    console.log(`\nNext steps:`)
    console.log(`1. Go to Admin Panel > Vendor Curation`)
    console.log(`2. Review and approve products`)
    console.log(`3. Approved products will appear in your store`)
    
  } catch (error) {
    console.error("Error setting up curation:", error)
  }
  
  process.exit(0)
}

setupVendorCuration()