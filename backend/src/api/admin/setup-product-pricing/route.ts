/**
 * Setup Product Pricing - Medusa Native Implementation
 * Uses Medusa's PriceSet system properly without Stripe price IDs
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// 45-tier pricing structure (prices only, no Stripe IDs needed)
const PRICING_TIERS = {
  // Suits
  SUIT_BASIC: 199.99,
  SUIT_STANDARD: 229.99,
  SUIT_PREMIUM: 249.99,
  SUIT_LUXURY: 279.99,
  SUIT_ELITE: 299.99,
  SUIT_BOYS: 149.99,
  
  // Tuxedos
  TUXEDO_BASIC: 199.99,
  TUXEDO_STANDARD: 229.99,
  TUXEDO_PREMIUM: 249.99,
  TUXEDO_SHAWL: 269.99,
  TUXEDO_PAISLEY: 299.99,
  TUXEDO_DOUBLE_BREASTED: 319.99,
  TUXEDO_VELVET: 349.99,
  TUXEDO_GOLD: 329.99,
  
  // Shirts
  SHIRT_BASIC: 34.99,
  SHIRT_STANDARD: 59.99,
  SHIRT_STRETCH: 69.99,
  SHIRT_PREMIUM: 79.99,
  SHIRT_LUXURY: 89.99,
  
  // Accessories
  ACCESSORY_SUSPENDERS_BASIC: 29.99,
  ACCESSORY_SUSPENDERS: 34.99,
  ACCESSORY_TIE: 39.99,
  ACCESSORY_BOWTIE: 44.99,
  ACCESSORY_SET: 49.99,
  ACCESSORY_VEST: 54.99,
  ACCESSORY_SILK_SET: 59.99,
  ACCESSORY_CUMMERBUND: 64.99,
  ACCESSORY_PREMIUM: 69.99,
  ACCESSORY_LUXURY: 79.99,
  
  // Shoes
  SHOES_BASIC: 99.99,
  SHOES_STANDARD: 129.99,
  SHOES_PREMIUM: 149.99,
  
  // Outerwear
  OUTERWEAR_JACKET: 149.99,
  OUTERWEAR_VELVET: 229.99,
  OUTERWEAR_WOOL: 279.99,
  OUTERWEAR_PREMIUM: 349.99,
  
  // Boy's
  BOYS_SUIT_BASIC: 99.99,
  BOYS_SUIT_STANDARD: 129.99,
  BOYS_SUIT_5PC: 149.99,
  BOYS_TUXEDO: 159.99,
  BOYS_PREMIUM: 179.99,
  
  // Casual
  CASUAL_BASIC: 59.99,
  CASUAL_STANDARD: 89.99,
  CASUAL_STRETCH: 119.99,
  CASUAL_PREMIUM: 149.99
}

// Function to determine which tier a product belongs to
function getTierForProduct(product: any): { name: string; price: number } | null {
  const title = (product.title || '').toLowerCase()
  const category = (product.category_id || '').toLowerCase()
  
  // Boy's products
  if (title.includes("boy") || title.includes("kid")) {
    if (title.includes("5pc") || title.includes("5 piece")) {
      return { name: "BOYS_SUIT_5PC", price: PRICING_TIERS.BOYS_SUIT_5PC }
    }
    if (title.includes("tuxedo")) {
      return { name: "BOYS_TUXEDO", price: PRICING_TIERS.BOYS_TUXEDO }
    }
    if (title.includes("premium") || title.includes("luxury")) {
      return { name: "BOYS_PREMIUM", price: PRICING_TIERS.BOYS_PREMIUM }
    }
    if (title.includes("standard")) {
      return { name: "BOYS_SUIT_STANDARD", price: PRICING_TIERS.BOYS_SUIT_STANDARD }
    }
    return { name: "BOYS_SUIT_BASIC", price: PRICING_TIERS.BOYS_SUIT_BASIC }
  }
  
  // Tuxedos
  if (title.includes("tuxedo") || category.includes("tuxedo")) {
    if (title.includes("velvet")) {
      return { name: "TUXEDO_VELVET", price: PRICING_TIERS.TUXEDO_VELVET }
    }
    if (title.includes("gold")) {
      return { name: "TUXEDO_GOLD", price: PRICING_TIERS.TUXEDO_GOLD }
    }
    if (title.includes("double breasted")) {
      return { name: "TUXEDO_DOUBLE_BREASTED", price: PRICING_TIERS.TUXEDO_DOUBLE_BREASTED }
    }
    if (title.includes("paisley")) {
      return { name: "TUXEDO_PAISLEY", price: PRICING_TIERS.TUXEDO_PAISLEY }
    }
    if (title.includes("shawl")) {
      return { name: "TUXEDO_SHAWL", price: PRICING_TIERS.TUXEDO_SHAWL }
    }
    if (title.includes("premium")) {
      return { name: "TUXEDO_PREMIUM", price: PRICING_TIERS.TUXEDO_PREMIUM }
    }
    if (title.includes("tone trim")) {
      return { name: "TUXEDO_STANDARD", price: PRICING_TIERS.TUXEDO_STANDARD }
    }
    return { name: "TUXEDO_BASIC", price: PRICING_TIERS.TUXEDO_BASIC }
  }
  
  // Suits
  if (title.includes("suit") || category.includes("suit")) {
    if (title.includes("elite") || title.includes("signature")) {
      return { name: "SUIT_ELITE", price: PRICING_TIERS.SUIT_ELITE }
    }
    if (title.includes("luxury") || title.includes("executive")) {
      return { name: "SUIT_LUXURY", price: PRICING_TIERS.SUIT_LUXURY }
    }
    if (title.includes("premium") || title.includes("wool")) {
      return { name: "SUIT_PREMIUM", price: PRICING_TIERS.SUIT_PREMIUM }
    }
    if (title.includes("pin stripe") || title.includes("fall") || title.includes("double breasted")) {
      return { name: "SUIT_STANDARD", price: PRICING_TIERS.SUIT_STANDARD }
    }
    return { name: "SUIT_BASIC", price: PRICING_TIERS.SUIT_BASIC }
  }
  
  // Shirts
  if (title.includes("shirt") || category.includes("shirt")) {
    if (title.includes("luxury")) {
      return { name: "SHIRT_LUXURY", price: PRICING_TIERS.SHIRT_LUXURY }
    }
    if (title.includes("premium")) {
      return { name: "SHIRT_PREMIUM", price: PRICING_TIERS.SHIRT_PREMIUM }
    }
    if (title.includes("ultra stretch") || title.includes("stretch")) {
      return { name: "SHIRT_STRETCH", price: PRICING_TIERS.SHIRT_STRETCH }
    }
    if (title.includes("dress shirt") || title.includes("formal")) {
      return { name: "SHIRT_STANDARD", price: PRICING_TIERS.SHIRT_STANDARD }
    }
    return { name: "SHIRT_BASIC", price: PRICING_TIERS.SHIRT_BASIC }
  }
  
  // Accessories
  if (title.includes("suspender") || title.includes("tie") || title.includes("bowtie") || 
      title.includes("cummerbund") || title.includes("vest") || category.includes("accessor")) {
    if (title.includes("luxury")) {
      return { name: "ACCESSORY_LUXURY", price: PRICING_TIERS.ACCESSORY_LUXURY }
    }
    if (title.includes("premium")) {
      return { name: "ACCESSORY_PREMIUM", price: PRICING_TIERS.ACCESSORY_PREMIUM }
    }
    if (title.includes("cummerbund")) {
      return { name: "ACCESSORY_CUMMERBUND", price: PRICING_TIERS.ACCESSORY_CUMMERBUND }
    }
    if (title.includes("silk") && title.includes("set")) {
      return { name: "ACCESSORY_SILK_SET", price: PRICING_TIERS.ACCESSORY_SILK_SET }
    }
    if (title.includes("vest") && !title.includes("set")) {
      return { name: "ACCESSORY_VEST", price: PRICING_TIERS.ACCESSORY_VEST }
    }
    if (title.includes("set") || title.includes("combo")) {
      return { name: "ACCESSORY_SET", price: PRICING_TIERS.ACCESSORY_SET }
    }
    if (title.includes("bowtie")) {
      return { name: "ACCESSORY_BOWTIE", price: PRICING_TIERS.ACCESSORY_BOWTIE }
    }
    if (title.includes("tie") && !title.includes("bowtie")) {
      return { name: "ACCESSORY_TIE", price: PRICING_TIERS.ACCESSORY_TIE }
    }
    if (title === "black suspenders" || title === "navy suspenders") {
      return { name: "ACCESSORY_SUSPENDERS_BASIC", price: PRICING_TIERS.ACCESSORY_SUSPENDERS_BASIC }
    }
    if (title.includes("suspender")) {
      return { name: "ACCESSORY_SUSPENDERS", price: PRICING_TIERS.ACCESSORY_SUSPENDERS }
    }
    return { name: "ACCESSORY_TIE", price: PRICING_TIERS.ACCESSORY_TIE }
  }
  
  // Shoes
  if (title.includes("shoe") || title.includes("oxford") || title.includes("loafer") || category.includes("footwear")) {
    if (title.includes("premium") || title.includes("leather")) {
      return { name: "SHOES_PREMIUM", price: PRICING_TIERS.SHOES_PREMIUM }
    }
    if (title.includes("standard") || title.includes("dress")) {
      return { name: "SHOES_STANDARD", price: PRICING_TIERS.SHOES_STANDARD }
    }
    return { name: "SHOES_BASIC", price: PRICING_TIERS.SHOES_BASIC }
  }
  
  // Outerwear
  if (title.includes("jacket") || title.includes("coat") || title.includes("blazer") || category.includes("outerwear")) {
    if (title.includes("premium") || title.includes("cashmere")) {
      return { name: "OUTERWEAR_PREMIUM", price: PRICING_TIERS.OUTERWEAR_PREMIUM }
    }
    if (title.includes("wool") || title.includes("overcoat")) {
      return { name: "OUTERWEAR_WOOL", price: PRICING_TIERS.OUTERWEAR_WOOL }
    }
    if (title.includes("velvet")) {
      return { name: "OUTERWEAR_VELVET", price: PRICING_TIERS.OUTERWEAR_VELVET }
    }
    return { name: "OUTERWEAR_JACKET", price: PRICING_TIERS.OUTERWEAR_JACKET }
  }
  
  // Casual
  if (title.includes("casual") || title.includes("polo") || title.includes("khaki") || category.includes("casual")) {
    if (title.includes("premium")) {
      return { name: "CASUAL_PREMIUM", price: PRICING_TIERS.CASUAL_PREMIUM }
    }
    if (title.includes("stretch")) {
      return { name: "CASUAL_STRETCH", price: PRICING_TIERS.CASUAL_STRETCH }
    }
    if (title.includes("standard")) {
      return { name: "CASUAL_STANDARD", price: PRICING_TIERS.CASUAL_STANDARD }
    }
    return { name: "CASUAL_BASIC", price: PRICING_TIERS.CASUAL_BASIC }
  }
  
  // Default to SUIT_BASIC if no match
  return { name: "SUIT_BASIC", price: PRICING_TIERS.SUIT_BASIC }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    const regionModuleService = req.scope.resolve(Modules.REGION)
    
    // Get regions for multi-currency support
    const regions = await regionModuleService.listRegions()
    const defaultRegion = regions.find((r: any) => r.currency_code === 'usd') || regions[0]
    
    // Get all products - CORRECT API USAGE
    const products = await productModuleService.listProducts(
      {}, // filters first
      { 
        take: 500,
        relations: ['variants']
      } // config second
    )
    
    const results = {
      total_products: products.length,
      products_updated: 0,
      variants_priced: 0,
      errors: [] as any[],
      sample_updates: [] as any[]
    }
    
    // Process each product
    for (const product of products) {
      try {
        const tierInfo = getTierForProduct(product)
        if (!tierInfo) continue
        
        // Update product metadata with tier info (for reference only)
        await productModuleService.updateProducts(product.id, {
          metadata: {
            ...((product.metadata as any) || {}),
            pricing_tier: tierInfo.name,
            tier_price: tierInfo.price
          }
        })
        
        // Process each variant
        if (product.variants && Array.isArray(product.variants)) {
          for (const variant of product.variants) {
            try {
              // Create a PriceSet for this variant
              const priceSet = await pricingModuleService.createPriceSets({
                prices: [
                  {
                    amount: tierInfo.price,
                    currency_code: 'usd',
                    min_quantity: 1,
                    max_quantity: null,
                    rules: {} // Empty object, not array
                  }
                ]
              })
              
              // Store price set ID in variant metadata for linking
              await productModuleService.updateProductVariants(variant.id, {
                metadata: {
                  ...((variant.metadata as any) || {}),
                  price_set_id: priceSet.id,
                  tier_price: tierInfo.price
                }
              })
              
              results.variants_priced++
              
              // Add to sample updates for first 5
              if (results.sample_updates.length < 5) {
                results.sample_updates.push({
                  product: product.title,
                  variant: variant.title || variant.sku,
                  tier: tierInfo.name,
                  price: tierInfo.price,
                  price_set_id: priceSet.id
                })
              }
              
            } catch (variantError: any) {
              results.errors.push({
                product: product.title,
                variant: variant.id,
                error: variantError.message
              })
            }
          }
        }
        
        results.products_updated++
        
      } catch (productError: any) {
        results.errors.push({
          product: product.title,
          error: productError.message
        })
      }
    }
    
    res.json({
      success: true,
      message: "Product pricing setup completed",
      results,
      next_steps: [
        "Link price sets to variants in your workflow",
        "Test checkout flow",
        "Verify prices display correctly"
      ]
    })
    
  } catch (error: any) {
    console.error("[Setup Product Pricing] Error:", error)
    res.status(500).json({
      error: "Failed to setup product pricing",
      message: error.message,
      details: error.stack
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get sample products - CORRECT API USAGE
    const products = await productModuleService.listProducts(
      {}, // filters
      { take: 10 } // config
    )
    
    const preview = products.map((product: any) => {
      const tierInfo = getTierForProduct(product)
      return {
        id: product.id,
        title: product.title,
        current_metadata: product.metadata,
        proposed_tier: tierInfo?.name || "UNKNOWN",
        proposed_price: tierInfo?.price || 0,
        variant_count: product.variants?.length || 0
      }
    })
    
    res.json({
      total_tiers: Object.keys(PRICING_TIERS).length,
      sample_products: preview,
      pricing_approach: "Medusa native PriceSets",
      currencies_supported: ["usd"],
      message: "Preview of pricing setup. POST to execute."
    })
    
  } catch (error: any) {
    console.error("[Setup Pricing Preview] Error:", error)
    res.status(500).json({
      error: "Failed to preview pricing setup",
      message: error.message
    })
  }
}