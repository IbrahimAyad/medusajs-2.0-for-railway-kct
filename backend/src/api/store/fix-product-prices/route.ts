/**
 * Fix Product Variant Prices for All Regions
 * This endpoint adds proper pricing to all product variants
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const regionModuleService = req.scope.resolve(Modules.REGION)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Get all regions
    const regions = await regionModuleService.listRegions()
    
    // Get all products with variants
    const products = await productModuleService.listProducts(
      { take: 300 },
      { relations: ["variants", "variants.prices"] }
    )
    
    let pricesCreated = 0
    let variantsProcessed = 0
    let skipped = 0
    const errors: string[] = []
    
    for (const product of products) {
      // Determine base price from metadata
      const basePrice = product.metadata?.price || 
                       product.metadata?.tier_price ||
                       (product.metadata?.pricing_tier === "TUXEDO_PREMIUM" ? 299.99 :
                        product.metadata?.pricing_tier === "TUXEDO_STANDARD" ? 229.99 :
                        product.metadata?.pricing_tier === "TUXEDO_BASIC" ? 199.99 :
                        product.metadata?.pricing_tier === "SUIT_PREMIUM" ? 249.99 :
                        product.metadata?.pricing_tier === "SUIT_STANDARD" ? 199.99 :
                        product.metadata?.pricing_tier === "ACCESSORY" ? 29.99 : 149.99)
      
      for (const variant of product.variants || []) {
        variantsProcessed++
        
        // Check if variant already has prices
        if (variant.prices && variant.prices.length > 0) {
          skipped++
          continue
        }
        
        // Create price sets for each region
        const priceSets = []
        for (const region of regions) {
          const priceAmount = Math.round(basePrice * 100) // Convert to cents
          const eurAmount = region.currency_code === 'eur' 
            ? Math.round(priceAmount * 0.92) // EUR conversion
            : priceAmount
            
          priceSets.push({
            amount: region.currency_code === 'eur' ? eurAmount : priceAmount,
            currency_code: region.currency_code,
            min_quantity: 1,
            max_quantity: null,
            variant_id: variant.id,
            region_id: region.id
          })
        }
        
        try {
          // Create all prices for this variant
          if (priceSets.length > 0) {
            // Create a price set
            const priceSet = await pricingModuleService.createPriceSets({
              rules: priceSets.map(p => ({
                variant_id: p.variant_id,
                region_id: p.region_id
              }))
            })
            
            // Add prices to the price set
            for (const price of priceSets) {
              await pricingModuleService.createPrices({
                amount: price.amount,
                currency_code: price.currency_code,
                price_set_id: priceSet.id,
                min_quantity: price.min_quantity,
                max_quantity: price.max_quantity
              })
              pricesCreated++
            }
          }
        } catch (error: any) {
          // Try alternative method - direct variant update
          try {
            await productModuleService.updateVariants(variant.id, {
              prices: priceSets.map(p => ({
                amount: p.amount,
                currency_code: p.currency_code,
                region_id: p.region_id
              }))
            })
            pricesCreated += priceSets.length
          } catch (updateError: any) {
            errors.push(`${variant.sku || variant.id}: ${updateError.message}`)
          }
        }
      }
    }
    
    res.json({
      success: true,
      summary: {
        products_processed: products.length,
        variants_processed: variantsProcessed,
        prices_created: pricesCreated,
        skipped: skipped,
        errors: errors.length
      },
      message: `Successfully added ${pricesCreated} prices to product variants`,
      regions: regions.map(r => ({ id: r.id, name: r.name, currency: r.currency_code })),
      sample_errors: errors.slice(0, 5)
    })
    
  } catch (error: any) {
    console.error("Price fix error:", error)
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}