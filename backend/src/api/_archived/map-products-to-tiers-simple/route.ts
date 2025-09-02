/**
 * Simplified Product to Tier Mapping
 * Maps all products to pricing tiers with Stripe IDs
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Comprehensive 45-tier pricing structure with Stripe price IDs
const PRICING_TIERS: any = {
  // Suits
  SUIT_BASIC: { price: 199.99, stripe_id: "price_1S2zyPCHc12x7sCzX7iCygWI" },
  SUIT_STANDARD: { price: 229.99, stripe_id: "price_1S2zyaCHc12x7sCzKcu7dzIL" },
  SUIT_PREMIUM: { price: 249.99, stripe_id: "price_1S2zyjCHc12x7sCzUxj0oCQo" },
  SUIT_LUXURY: { price: 279.99, stripe_id: "price_1S2zytCHc12x7sCzMOQxeB8n" },
  SUIT_ELITE: { price: 299.99, stripe_id: "price_1S2zz4CHc12x7sCzOJgQJMgP" },
  SUIT_BOYS: { price: 149.99, stripe_id: "price_1S2zzECHc12x7sCzUHBFRZuw" },
  
  // Tuxedos
  TUXEDO_BASIC: { price: 199.99, stripe_id: "price_1S2zzPCHc12x7sCzRazHXwRR" },
  TUXEDO_STANDARD: { price: 229.99, stripe_id: "price_1S2zzaCHc12x7sCzs5lVCVii" },
  TUXEDO_PREMIUM: { price: 249.99, stripe_id: "price_1S2zzkCHc12x7sCzD9P29Rxg" },
  TUXEDO_SHAWL: { price: 269.99, stripe_id: "price_1S2zzvCHc12x7sCzrMKsJEKh" },
  TUXEDO_PAISLEY: { price: 299.99, stripe_id: "price_1S3006CHc12x7sCzBFYA8v4d" },
  TUXEDO_DOUBLE_BREASTED: { price: 319.99, stripe_id: "price_1S300HCHc12x7sCzQO8BW7fw" },
  TUXEDO_VELVET: { price: 349.99, stripe_id: "price_1S300SCHc12x7sCz3v60Ku4Y" },
  TUXEDO_GOLD: { price: 329.99, stripe_id: "price_1S300dCHc12x7sCzOOO5tQRv" },
  
  // Shirts
  SHIRT_BASIC: { price: 34.99, stripe_id: "price_1S300oCHc12x7sCzL4HNkkD2" },
  SHIRT_STANDARD: { price: 59.99, stripe_id: "price_1S300zCHc12x7sCzvnJ0FFQY" },
  SHIRT_STRETCH: { price: 69.99, stripe_id: "price_1S301ACHc12x7sCzFUb8kz68" },
  SHIRT_PREMIUM: { price: 79.99, stripe_id: "price_1S301LCHc12x7sCzYuXLy0Y2" },
  SHIRT_LUXURY: { price: 89.99, stripe_id: "price_1S301WCHc12x7sCzRALd5Aw2" },
  
  // Accessories
  ACCESSORY_SUSPENDERS_BASIC: { price: 29.99, stripe_id: "price_1S301hCHc12x7sCzSRXXE63E" },
  ACCESSORY_SUSPENDERS: { price: 34.99, stripe_id: "price_1S301sCHc12x7sCzz8zRXCTE" },
  ACCESSORY_TIE: { price: 39.99, stripe_id: "price_1S3023CHc12x7sCzvP3LzF5a" },
  ACCESSORY_BOWTIE: { price: 44.99, stripe_id: "price_1S302ECHc12x7sCzv82o0oE1" },
  ACCESSORY_SET: { price: 49.99, stripe_id: "price_1S302PCHc12x7sCz9dLOA48Y" },
  ACCESSORY_VEST: { price: 54.99, stripe_id: "price_1S302aCHc12x7sCzcBQGzXA1" },
  ACCESSORY_SILK_SET: { price: 59.99, stripe_id: "price_1S302lCHc12x7sCzD7c0eRnm" },
  ACCESSORY_CUMMERBUND: { price: 64.99, stripe_id: "price_1S302wCHc12x7sCzhqfCIxRU" },
  ACCESSORY_PREMIUM: { price: 69.99, stripe_id: "price_1S3037CHc12x7sCz8nfXJ5Gv" },
  ACCESSORY_LUXURY: { price: 79.99, stripe_id: "price_1S303ICHc12x7sCzE9cqnPeB" },
  
  // Shoes
  SHOES_BASIC: { price: 99.99, stripe_id: "price_1S303TCHc12x7sCzXNt6MG1Y" },
  SHOES_STANDARD: { price: 129.99, stripe_id: "price_1S303eCHc12x7sCzBgf5mQOj" },
  SHOES_PREMIUM: { price: 149.99, stripe_id: "price_1S303pCHc12x7sCzNKUzqyDC" },
  
  // Outerwear
  OUTERWEAR_JACKET: { price: 149.99, stripe_id: "price_1S3040CHc12x7sCzUfz4r8R0" },
  OUTERWEAR_VELVET: { price: 229.99, stripe_id: "price_1S304BCHc12x7sCzgJXzCfBT" },
  OUTERWEAR_WOOL: { price: 279.99, stripe_id: "price_1S304MCHc12x7sCzCyKmeCiD" },
  OUTERWEAR_PREMIUM: { price: 349.99, stripe_id: "price_1S304XCHc12x7sCzdnkJgGQn" },
  
  // Boy's
  BOYS_SUIT_BASIC: { price: 99.99, stripe_id: "price_1S304iCHc12x7sCzGOFcvv8o" },
  BOYS_SUIT_STANDARD: { price: 129.99, stripe_id: "price_1S304tCHc12x7sCzBSCRoPhC" },
  BOYS_SUIT_5PC: { price: 149.99, stripe_id: "price_1S3054CHc12x7sCzXLWNnj4K" },
  BOYS_TUXEDO: { price: 159.99, stripe_id: "price_1S305FCHc12x7sCzjmuOCtM0" },
  BOYS_PREMIUM: { price: 179.99, stripe_id: "price_1S305QCHc12x7sCznCGQvJLw" },
  
  // Casual
  CASUAL_BASIC: { price: 59.99, stripe_id: "price_1S305bCHc12x7sCzb3OPYfPp" },
  CASUAL_STANDARD: { price: 89.99, stripe_id: "price_1S305mCHc12x7sCzSJrSnGzg" },
  CASUAL_STRETCH: { price: 119.99, stripe_id: "price_1S305xCHc12x7sCzfD2pJTGz" },
  CASUAL_PREMIUM: { price: 149.99, stripe_id: "price_1S3068CHc12x7sCzjKXcASYy" }
}

// Function to determine which tier a product belongs to
function getTierForProduct(product: any): { name: string; tier: any } | null {
  const title = (product.title || '').toLowerCase()
  const category = (product.category_id || '').toLowerCase()
  
  // Boy's products
  if (title.includes("boy") || title.includes("kid")) {
    if (title.includes("5pc") || title.includes("5 piece")) return { name: "BOYS_SUIT_5PC", tier: PRICING_TIERS.BOYS_SUIT_5PC }
    if (title.includes("tuxedo")) return { name: "BOYS_TUXEDO", tier: PRICING_TIERS.BOYS_TUXEDO }
    if (title.includes("premium") || title.includes("luxury")) return { name: "BOYS_PREMIUM", tier: PRICING_TIERS.BOYS_PREMIUM }
    if (title.includes("standard")) return { name: "BOYS_SUIT_STANDARD", tier: PRICING_TIERS.BOYS_SUIT_STANDARD }
    return { name: "BOYS_SUIT_BASIC", tier: PRICING_TIERS.BOYS_SUIT_BASIC }
  }
  
  // Tuxedos
  if (title.includes("tuxedo") || category.includes("tuxedo")) {
    if (title.includes("velvet")) return { name: "TUXEDO_VELVET", tier: PRICING_TIERS.TUXEDO_VELVET }
    if (title.includes("gold")) return { name: "TUXEDO_GOLD", tier: PRICING_TIERS.TUXEDO_GOLD }
    if (title.includes("double breasted")) return { name: "TUXEDO_DOUBLE_BREASTED", tier: PRICING_TIERS.TUXEDO_DOUBLE_BREASTED }
    if (title.includes("paisley")) return { name: "TUXEDO_PAISLEY", tier: PRICING_TIERS.TUXEDO_PAISLEY }
    if (title.includes("shawl")) return { name: "TUXEDO_SHAWL", tier: PRICING_TIERS.TUXEDO_SHAWL }
    if (title.includes("premium")) return { name: "TUXEDO_PREMIUM", tier: PRICING_TIERS.TUXEDO_PREMIUM }
    if (title.includes("tone trim")) return { name: "TUXEDO_STANDARD", tier: PRICING_TIERS.TUXEDO_STANDARD }
    return { name: "TUXEDO_BASIC", tier: PRICING_TIERS.TUXEDO_BASIC }
  }
  
  // Suits
  if (title.includes("suit") || category.includes("suit")) {
    if (title.includes("elite") || title.includes("signature")) return { name: "SUIT_ELITE", tier: PRICING_TIERS.SUIT_ELITE }
    if (title.includes("luxury") || title.includes("executive")) return { name: "SUIT_LUXURY", tier: PRICING_TIERS.SUIT_LUXURY }
    if (title.includes("premium") || title.includes("wool")) return { name: "SUIT_PREMIUM", tier: PRICING_TIERS.SUIT_PREMIUM }
    if (title.includes("pin stripe") || title.includes("fall") || title.includes("double breasted")) {
      return { name: "SUIT_STANDARD", tier: PRICING_TIERS.SUIT_STANDARD }
    }
    return { name: "SUIT_BASIC", tier: PRICING_TIERS.SUIT_BASIC }
  }
  
  // Shirts
  if (title.includes("shirt") || category.includes("shirt")) {
    if (title.includes("luxury")) return { name: "SHIRT_LUXURY", tier: PRICING_TIERS.SHIRT_LUXURY }
    if (title.includes("premium")) return { name: "SHIRT_PREMIUM", tier: PRICING_TIERS.SHIRT_PREMIUM }
    if (title.includes("ultra stretch") || title.includes("stretch")) return { name: "SHIRT_STRETCH", tier: PRICING_TIERS.SHIRT_STRETCH }
    if (title.includes("dress shirt") || title.includes("formal")) return { name: "SHIRT_STANDARD", tier: PRICING_TIERS.SHIRT_STANDARD }
    return { name: "SHIRT_BASIC", tier: PRICING_TIERS.SHIRT_BASIC }
  }
  
  // Accessories
  if (title.includes("suspender") || title.includes("tie") || title.includes("bowtie") || 
      title.includes("cummerbund") || title.includes("vest") || category.includes("accessor")) {
    if (title.includes("luxury")) return { name: "ACCESSORY_LUXURY", tier: PRICING_TIERS.ACCESSORY_LUXURY }
    if (title.includes("premium")) return { name: "ACCESSORY_PREMIUM", tier: PRICING_TIERS.ACCESSORY_PREMIUM }
    if (title.includes("cummerbund")) return { name: "ACCESSORY_CUMMERBUND", tier: PRICING_TIERS.ACCESSORY_CUMMERBUND }
    if (title.includes("silk") && title.includes("set")) return { name: "ACCESSORY_SILK_SET", tier: PRICING_TIERS.ACCESSORY_SILK_SET }
    if (title.includes("vest") && !title.includes("set")) return { name: "ACCESSORY_VEST", tier: PRICING_TIERS.ACCESSORY_VEST }
    if (title.includes("set") || title.includes("combo")) return { name: "ACCESSORY_SET", tier: PRICING_TIERS.ACCESSORY_SET }
    if (title.includes("bowtie")) return { name: "ACCESSORY_BOWTIE", tier: PRICING_TIERS.ACCESSORY_BOWTIE }
    if (title.includes("tie") && !title.includes("bowtie")) return { name: "ACCESSORY_TIE", tier: PRICING_TIERS.ACCESSORY_TIE }
    if (title === "black suspenders" || title === "navy suspenders") {
      return { name: "ACCESSORY_SUSPENDERS_BASIC", tier: PRICING_TIERS.ACCESSORY_SUSPENDERS_BASIC }
    }
    if (title.includes("suspender")) return { name: "ACCESSORY_SUSPENDERS", tier: PRICING_TIERS.ACCESSORY_SUSPENDERS }
    return { name: "ACCESSORY_TIE", tier: PRICING_TIERS.ACCESSORY_TIE }
  }
  
  // Shoes
  if (title.includes("shoe") || title.includes("oxford") || title.includes("loafer") || category.includes("footwear")) {
    if (title.includes("premium") || title.includes("leather")) return { name: "SHOES_PREMIUM", tier: PRICING_TIERS.SHOES_PREMIUM }
    if (title.includes("standard") || title.includes("dress")) return { name: "SHOES_STANDARD", tier: PRICING_TIERS.SHOES_STANDARD }
    return { name: "SHOES_BASIC", tier: PRICING_TIERS.SHOES_BASIC }
  }
  
  // Outerwear
  if (title.includes("jacket") || title.includes("coat") || title.includes("blazer") || category.includes("outerwear")) {
    if (title.includes("premium") || title.includes("cashmere")) return { name: "OUTERWEAR_PREMIUM", tier: PRICING_TIERS.OUTERWEAR_PREMIUM }
    if (title.includes("wool") || title.includes("overcoat")) return { name: "OUTERWEAR_WOOL", tier: PRICING_TIERS.OUTERWEAR_WOOL }
    if (title.includes("velvet")) return { name: "OUTERWEAR_VELVET", tier: PRICING_TIERS.OUTERWEAR_VELVET }
    return { name: "OUTERWEAR_JACKET", tier: PRICING_TIERS.OUTERWEAR_JACKET }
  }
  
  // Casual
  if (title.includes("casual") || title.includes("polo") || title.includes("khaki") || category.includes("casual")) {
    if (title.includes("premium")) return { name: "CASUAL_PREMIUM", tier: PRICING_TIERS.CASUAL_PREMIUM }
    if (title.includes("stretch")) return { name: "CASUAL_STRETCH", tier: PRICING_TIERS.CASUAL_STRETCH }
    if (title.includes("standard")) return { name: "CASUAL_STANDARD", tier: PRICING_TIERS.CASUAL_STANDARD }
    return { name: "CASUAL_BASIC", tier: PRICING_TIERS.CASUAL_BASIC }
  }
  
  // Default to SUIT_BASIC if no match
  return { name: "SUIT_BASIC", tier: PRICING_TIERS.SUIT_BASIC }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get all products
    const products = await productModuleService.listProducts({
      take: 500
    })
    
    const updates: any[] = []
    let productsUpdated = 0
    
    // Process each product
    for (const product of products) {
      const tierInfo = getTierForProduct(product)
      if (!tierInfo) continue
      
      const { name: tierName, tier } = tierInfo
      
      // Update product metadata with tier information
      await productModuleService.updateProducts(product.id, {
        metadata: {
          ...((product.metadata as any) || {}),
          tier: tierName,
          tier_price: tier.price,
          stripe_price_id: tier.stripe_id
        }
      })
      
      productsUpdated++
      updates.push({
        product: product.title,
        tier: tierName,
        price: tier.price,
        stripe_id: tier.stripe_id
      })
    }
    
    // Count tier distribution
    const tierDistribution: any = {}
    updates.forEach(u => {
      tierDistribution[u.tier] = (tierDistribution[u.tier] || 0) + 1
    })
    
    res.json({
      success: true,
      products_mapped: productsUpdated,
      total_products: products.length,
      tier_distribution: tierDistribution,
      sample_updated: updates.slice(0, 10),
      message: `Successfully mapped ${productsUpdated} products to pricing tiers with Stripe IDs`
    })
    
  } catch (error: any) {
    console.error("[Map Products to Tiers] Error:", error)
    res.status(500).json({
      error: "Failed to map products to tiers",
      message: error.message
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get sample of products to show what will be mapped
    const products = await productModuleService.listProducts({
      take: 20
    })
    
    const mappings = products.map(product => {
      const tierInfo = getTierForProduct(product)
      return {
        id: product.id,
        title: product.title,
        current_metadata: product.metadata,
        proposed_tier: tierInfo?.name || "UNKNOWN",
        proposed_price: tierInfo?.tier.price || 0,
        proposed_stripe_id: tierInfo?.tier.stripe_id || "N/A"
      }
    })
    
    res.json({
      total_products: products.length,
      available_tiers: Object.keys(PRICING_TIERS).length,
      sample_mappings: mappings,
      message: "Preview of product tier mappings. POST to this endpoint to apply."
    })
    
  } catch (error: any) {
    console.error("[Map Products Preview] Error:", error)
    res.status(500).json({
      error: "Failed to preview mapping",
      message: error.message
    })
  }
}