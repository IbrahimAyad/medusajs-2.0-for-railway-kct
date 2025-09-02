/**
 * Fix products without prices
 * Adds default prices based on product type
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
    const regionModuleService = req.scope.resolve(Modules.REGION)
    
    // Get all regions
    const regions = await regionModuleService.listRegions()
    
    // Get all products
    const products = await productModuleService.listProducts({
      take: 500
    })
    
    // Find products without prices
    const productsWithoutPrices = []
    const variantsNeedingPrices = []
    
    for (const product of products) {
      for (const variant of product.variants) {
        // Check if variant has prices
        const prices = await pricingModuleService.listPrices({})
        
        if (!prices || prices.length === 0) {
          productsWithoutPrices.push({
            product_id: product.id,
            product_title: product.title,
            variant_id: variant.id,
            variant_title: variant.title
          })
          variantsNeedingPrices.push(variant)
        }
      }
    }
    
    // Determine default prices based on product type and your specific pricing
    function getDefaultPrice(productTitle: string): number {
      const title = productTitle.toLowerCase()
      
      // Boy's Suits - 5pc Stacy Adams
      if (title.includes("stacy adams boy") || title.includes("boy's 5pc")) {
        return 149.99
      }
      
      // Slim/Stretch Suits
      if (title.includes('slim stretch')) {
        return 249.99
      }
      
      // Tuxedos with specific patterns
      if (title.includes('tuxedo')) {
        // Premium tuxedos with paisley, velvet, or gold design
        if (title.includes('paisley') || title.includes('velvet') || title.includes('gold design')) {
          return 249.99
        }
        // Double breasted tuxedos
        if (title.includes('double breasted')) {
          return 229.99
        }
        // Tone trim and shawl lapel tuxedos
        if (title.includes('tone trim') && title.includes('shawl')) {
          return 229.99
        }
        // Basic tuxedos and tone trim without shawl
        return 199.99
      }
      
      // Specific tuxedo overrides
      if (title === 'white black tuxedo') return 229.99
      if (title === 'vivid purple tuxedo tone trim tuxedo') return 249.99
      
      // Velvet Jackets
      if (title.includes('velvet jacker')) {
        return 229.99
      }
      
      // Suits
      if (title.includes('suit')) {
        // Pin stripe suits
        if (title.includes('pin stripe')) {
          return 229.99
        }
        // Fall collection and double breasted
        if (title.includes('fall') || title.includes('double breasted')) {
          return 229.99
        }
        // Satin shawl collar
        if (title.includes('satin shawl')) {
          return 229.99
        }
        // Brown Gold Buttons special
        if (title.includes('brown gold buttons')) {
          return 229.99
        }
        // Brick Fall Suit
        if (title === 'brick fall suit') {
          return 229.99
        }
        // Default suits (Classic Navy, Black Suit, etc.)
        return 229.99
      }
      
      // Dress Shirts
      if (title.includes('shirt')) {
        if (title.includes('ultra stretch')) {
          return 69.99
        }
        if (title.includes('collarless') || title.includes('dress shirt')) {
          return 59.99
        }
        return 59.99
      }
      
      // Suspenders and Accessories
      if (title.includes('suspender')) {
        // Just suspenders alone
        if (title === 'black suspenders' || title === 'navy suspenders') {
          return 34.99
        }
        // Suspender bowtie sets
        if (title.includes('bowtie set')) {
          return 49.99
        }
        return 49.99
      }
      
      // Silk Bow Tie Set
      if (title.includes('silk bow tie set')) {
        return 49.99
      }
      
      // Default price for any unmatched items
      return 99.99
    }
    
    // Add prices for variants that need them
    const pricesAdded = []
    
    for (const item of productsWithoutPrices) {
      const defaultPrice = getDefaultPrice(item.product_title)
      
      try {
        // Create prices for each region
        for (const region of regions) {
          const priceData = {
            title: `Price for ${item.variant_title}`,
            currency_code: region.currency_code,
            amount: defaultPrice,
            variant_id: item.variant_id,
            rules: []
          }
          
          const price = await pricingModuleService.createPriceSets({
            prices: [priceData]
          })
          
          pricesAdded.push({
            variant_id: item.variant_id,
            product_title: item.product_title,
            variant_title: item.variant_title,
            price: defaultPrice,
            currency: region.currency_code,
            price_id: price.id
          })
        }
      } catch (error: any) {
        console.error(`Failed to add price for variant ${item.variant_id}:`, error.message)
      }
    }
    
    res.json({
      success: true,
      products_without_prices: productsWithoutPrices.length,
      prices_added: pricesAdded.length,
      details: {
        products_fixed: [...new Set(productsWithoutPrices.map(p => p.product_title))].slice(0, 10),
        sample_prices_added: pricesAdded.slice(0, 5)
      },
      summary: {
        total_products_checked: products.length,
        products_needing_prices: productsWithoutPrices.length,
        prices_created: pricesAdded.length,
        regions_covered: regions.map(r => r.name)
      }
    })
    
  } catch (error: any) {
    console.error("[Fix Missing Prices] Error:", error)
    res.status(500).json({
      error: "Failed to fix missing prices",
      message: error.message
    })
  }
}

// GET endpoint to check status without making changes
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Get all products
    const products = await productModuleService.listProducts({
      take: 500
    })
    
    // Check which products don't have prices
    const productsWithoutPrices = []
    let totalVariants = 0
    let variantsWithPrices = 0
    
    for (const product of products) {
      for (const variant of product.variants) {
        totalVariants++
        
        const prices = await pricingModuleService.listPrices({
          take: 1
        })
        
        if (prices && prices.length > 0) {
          variantsWithPrices++
        } else {
          productsWithoutPrices.push({
            product_title: product.title,
            variant_title: variant.title,
            suggested_price: getDefaultPrice(product.title)
          })
        }
      }
    }
    
    function getDefaultPrice(title: string): number {
      const t = title.toLowerCase()
      
      // Boy's Suits
      if (t.includes("stacy adams boy") || t.includes("boy's 5pc")) return 149.99
      
      // Slim/Stretch Suits
      if (t.includes('slim stretch')) return 249.99
      
      // Tuxedos
      if (t.includes('tuxedo')) {
        if (t.includes('paisley') || t.includes('velvet') || t.includes('gold design')) return 249.99
        if (t.includes('double breasted')) return 229.99
        if (t.includes('tone trim') && t.includes('shawl')) return 229.99
        return 199.99
      }
      
      // Velvet Jackets
      if (t.includes('velvet jacker')) return 229.99
      
      // Suits
      if (t.includes('suit')) {
        if (t.includes('pin stripe')) return 229.99
        if (t.includes('fall') || t.includes('double breasted')) return 229.99
        if (t.includes('satin shawl')) return 229.99
        return 229.99
      }
      
      // Shirts
      if (t.includes('shirt')) {
        if (t.includes('ultra stretch')) return 69.99
        return 59.99
      }
      
      // Suspenders
      if (t.includes('suspender')) {
        if (t === 'black suspenders' || t === 'navy suspenders') return 34.99
        return 49.99
      }
      
      return 99.99
    }
    
    res.json({
      status: "check_only",
      total_products: products.length,
      total_variants: totalVariants,
      variants_with_prices: variantsWithPrices,
      variants_without_prices: totalVariants - variantsWithPrices,
      sample_products_without_prices: productsWithoutPrices.slice(0, 10),
      action_needed: productsWithoutPrices.length > 0 ? 
        "POST to this endpoint to add default prices" : 
        "All products have prices"
    })
    
  } catch (error: any) {
    console.error("[Check Missing Prices] Error:", error)
    res.status(500).json({
      error: "Failed to check prices",
      message: error.message
    })
  }
}