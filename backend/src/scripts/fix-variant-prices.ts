/**
 * Script to add prices to all product variants
 */

import { Modules } from "@medusajs/framework/utils"
import { initializeContainer } from "@medusajs/framework"

async function fixVariantPrices() {
  const container = await initializeContainer()
  
  const productModuleService = container.resolve(Modules.PRODUCT)
  const regionModuleService = container.resolve(Modules.REGION)
  const query = container.resolve("query")
  
  try {
    console.log("Starting variant price fix...")
    
    // Get regions
    const regions = await regionModuleService.listRegions()
    console.log(`Found ${regions.length} regions`)
    
    // Get all products with variants
    const products = await productModuleService.listProducts(
      { take: 500 },
      { relations: ["variants"] }
    )
    console.log(`Found ${products.length} products`)
    
    let totalPricesCreated = 0
    let variantsProcessed = 0
    
    for (const product of products) {
      const basePrice = 
        product.metadata?.price || 
        product.metadata?.tier_price ||
        (product.metadata?.pricing_tier === "TUXEDO_PREMIUM" ? 299.99 :
         product.metadata?.pricing_tier === "TUXEDO_STANDARD" ? 229.99 :
         product.metadata?.pricing_tier === "TUXEDO_BASIC" ? 199.99 :
         product.metadata?.pricing_tier === "SUIT_PREMIUM" ? 249.99 :
         product.metadata?.pricing_tier === "SUIT_STANDARD" ? 199.99 :
         product.metadata?.pricing_tier === "ACCESSORY" ? 29.99 : 149.99)
      
      for (const variant of product.variants || []) {
        variantsProcessed++
        
        // Create prices for each region
        for (const region of regions) {
          try {
            const amount = Math.round(basePrice * 100) // Convert to cents
            const eurAmount = region.currency_code === 'eur' 
              ? Math.round(amount * 0.92) // EUR conversion
              : amount
            
            // Use the query service to create price directly
            await query.graph({
              entity: "product_variant_price",
              fields: ["id"],
              filters: {
                variant_id: variant.id,
                region_id: region.id
              }
            }).then(async (existing) => {
              if (!existing?.data?.length) {
                // Create price if it doesn't exist
                const finalAmount = region.currency_code === 'eur' ? eurAmount : amount
                
                await query.create({
                  entity: "product_variant_price",
                  data: {
                    variant_id: variant.id,
                    currency_code: region.currency_code,
                    amount: finalAmount,
                    region_id: region.id,
                    min_quantity: 1
                  }
                })
                
                totalPricesCreated++
                console.log(`Created price for ${variant.sku || variant.id} in ${region.name}`)
              }
            })
          } catch (error: any) {
            console.log(`Skipping ${variant.sku}: ${error.message}`)
          }
        }
      }
    }
    
    console.log("\n=== PRICE FIX COMPLETE ===")
    console.log(`Variants processed: ${variantsProcessed}`)
    console.log(`Prices created: ${totalPricesCreated}`)
    console.log("==========================\n")
    
  } catch (error: any) {
    console.error("Error fixing prices:", error)
  } finally {
    await container.shutdown()
  }
}

// Run the script
fixVariantPrices().catch(console.error)