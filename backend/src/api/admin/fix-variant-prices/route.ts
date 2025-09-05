/**
 * Fix Variant Prices - Add region-specific prices to all variants
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Get all products with variants
    const products = await productModuleService.listProducts({
      take: 250
    }, {
      relations: ["variants"]
    })
    
    let pricesCreated = 0
    let errors = []
    
    // Define pricing for regions
    const regions = [
      { id: "reg_01K3S6NDGAC1DSWH9MCZCWBWWD", currency: "usd" }, // US
      { id: "reg_01K3PJN8B4519MH0QRFMB62J42", currency: "eur" }  // Europe
    ]
    
    for (const product of products) {
      // Use product's base price or tier-based pricing
      const basePrice = product.metadata?.price || 
                       (product.metadata?.pricing_tier === "TUXEDO_PREMIUM" ? 299.99 :
                        product.metadata?.pricing_tier === "TUXEDO_STANDARD" ? 229.99 :
                        product.metadata?.pricing_tier === "TUXEDO_BASIC" ? 199.99 :
                        product.metadata?.pricing_tier === "SUIT_PREMIUM" ? 249.99 :
                        product.metadata?.pricing_tier === "SUIT_STANDARD" ? 199.99 :
                        product.metadata?.pricing_tier === "ACCESSORY" ? 29.99 : 149.99)
      
      for (const variant of product.variants || []) {
        for (const region of regions) {
          try {
            // Create price for each variant in each region
            const priceAmount = Math.round(basePrice * 100) // Convert to cents
            
            await pricingModuleService.createPriceSets({
              prices: [{
                amount: priceAmount,
                currency_code: region.currency,
                rules: {
                  region_id: region.id,
                  variant_id: variant.id
                }
              }]
            })
            
            pricesCreated++
          } catch (error: any) {
            errors.push(`${variant.sku}: ${error.message}`)
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `Created ${pricesCreated} prices for variants`,
      products_processed: products.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
      total_errors: errors.length,
      note: "Prices have been added to all variants for US and Europe regions"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      note: "Failed to create variant prices"
    })
  }
}