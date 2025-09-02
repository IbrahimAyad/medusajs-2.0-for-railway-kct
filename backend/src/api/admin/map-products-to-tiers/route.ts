/**
 * Map all products to KCT Menswear pricing tiers
 * Assigns tier, price, and Stripe price ID to every product
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Complete KCT Menswear Pricing Tiers
const PRICING_TIERS = {
  // SUITS
  SUIT_BASIC: { price: 199.99, stripe_id: "price_1S2zyPCHc12x7sCzX7iCygWI" },
  SUIT_STANDARD: { price: 229.99, stripe_id: "price_1S2zyaCHc12x7sCzKcu7dzIL" },
  SUIT_PREMIUM: { price: 249.99, stripe_id: "price_1S2zykCHc12x7sCzrnNPe1oE" },
  SUIT_LUXURY: { price: 299.99, stripe_id: "price_1S2zz3CHc12x7sCzbvL33jJ3" },
  SUIT_BOYS_STACY: { price: 149.99, stripe_id: "price_1S2zzGCHc12x7sCztnnrCorW" },
  SUIT_BOYS: { price: 129.99, stripe_id: "price_1S2zzQCHc12x7sCzodmKx9cH" },
  
  // SALE SUITS
  SUIT_SALE: { price: 169.99, stripe_id: "price_1S30KkCHc12x7sCz1J2mhmv5" },
  SUIT_SALE_TWO: { price: 129.99, stripe_id: "price_1S30L5CHc12x7sCzvWFXYu7k" },
  BLAZER_SALE: { price: 149.99, stripe_id: "price_1S30KuCHc12x7sCzNdrN1nD5" },
  
  // TUXEDOS
  TUX_BASIC: { price: 199.99, stripe_id: "price_1S2zzcCHc12x7sCzVZ2DbWsQ" },
  TUX_STANDARD: { price: 229.99, stripe_id: "price_1S2zznCHc12x7sCzix1h2s33" },
  TUX_PREMIUM: { price: 249.99, stripe_id: "price_1S2zzyCHc12x7sCzwaPOM3La" },
  TUX_LUXURY: { price: 299.99, stripe_id: "price_1S3009CHc12x7sCzCMofK0As" },
  
  // SHIRTS
  SHIRT_BASIC: { price: 49.99, stripe_id: "price_1S300KCHc12x7sCzz3O0mPfK" },
  SHIRT_STANDARD: { price: 59.99, stripe_id: "price_1S300VCHc12x7sCzL7XmZ5cr" },
  SHIRT_PREMIUM: { price: 69.99, stripe_id: "price_1S300lCHc12x7sCzedEk3sfe" },
  
  // VESTS
  VEST_SUIT: { price: 39.99, stripe_id: "price_1S300wCHc12x7sCznLwlLLKj" },
  VEST_STANDARD: { price: 49.99, stripe_id: "price_1S3017CHc12x7sCz6tCpL8Rp" },
  VEST_PREMIUM: { price: 69.99, stripe_id: "price_1S301ICHc12x7sCzeRDopwFH" },
  
  // SEPARATES
  SEPARATES_JACKET: { price: 149.99, stripe_id: "price_1S30KECHc12x7sCzARPvey7v" },
  SEPARATES_PANTS: { price: 59.99, stripe_id: "price_1S30KPCHc12x7sCznLukbSwe" },
  SEPARATES_VEST: { price: 39.99, stripe_id: "price_1S30KZCHc12x7sCzlVEsnLHk" },
  
  // PANTS
  PANTS_DRESS: { price: 59.99, stripe_id: "price_1S301UCHc12x7sCzhkPtwtmD" },
  PANTS_STRETCH: { price: 69.99, stripe_id: "price_1S301gCHc12x7sCz1t7i73FS" },
  PANTS_TAPERED: { price: 69.99, stripe_id: "price_1S301rCHc12x7sCzAcCpZVSm" },
  
  // SHOES
  SHOES_BASIC: { price: 69.99, stripe_id: "price_1S3023CHc12x7sCzk5do4SRF" },
  SHOES_VELVET: { price: 79.99, stripe_id: "price_1S302ECHc12x7sCzTBeRbM3a" },
  SHOES_DRESS: { price: 89.99, stripe_id: "price_1S302SCHc12x7sCzAyr7Bbog" },
  SHOES_PREMIUM: { price: 99.99, stripe_id: "price_1S302dCHc12x7sCzfWxLOp32" },
  SHOES_SPIKES: { price: 129.99, stripe_id: "price_1S302oCHc12x7sCzwd2PLdk4" },
  
  // SWEATERS
  HEAVY_SWEATERS: { price: 145.00, stripe_id: "price_1S30LFCHc12x7sCzjgMG4PuZ" },
  SWEATERS: { price: 125.00, stripe_id: "price_1S30LPCHc12x7sCznzB2skkm" },
  MEDIUM_SWEATER: { price: 85.00, stripe_id: "price_1S30LaCHc12x7sCz4a7U7HqF" },
  TURTLE_NECK: { price: 45.00, stripe_id: "price_1S30LkCHc12x7sCzig6NuAAK" },
  MOC_NECK: { price: 45.00, stripe_id: "price_1S30LzCHc12x7sCzE4o82F4n" },
  
  // ACCESSORIES
  ACC_POCKET_SQUARE: { price: 10.00, stripe_id: "price_1S302zCHc12x7sCzNsRYYDOo" },
  ACC_SOCKS: { price: 12.00, stripe_id: "price_1S303BCHc12x7sCzVKRXzfHD" },
  GARMENT_BAG: { price: 12.00, stripe_id: "price_1S30JKCHc12x7sCz6MjnhDqp" },
  ACC_LAPEL_PIN: { price: 15.00, stripe_id: "price_1S30K2CHc12x7sCzGHmPBESD" },
  ACC_TIE_CLIP: { price: 17.00, stripe_id: "price_1S30JqCHc12x7sCzfqHbp10R" },
  ACC_GLOVES: { price: 24.99, stripe_id: "price_1S30JeCHc12x7sCzg12SkKnd" },
  ACC_TIES: { price: 29.99, stripe_id: "price_1S303LCHc12x7sCziIBxJdDW" },
  ACC_BELT: { price: 29.99, stripe_id: "price_1S303VCHc12x7sCzSg4n60tH" },
  ACC_SUSPENDERS: { price: 34.99, stripe_id: "price_1S303gCHc12x7sCzLV43VGxG" },
  ACC_CUFFLINKS: { price: 35.00, stripe_id: "price_1S303qCHc12x7sCzWSVweMGr" },
  ACC_SETS: { price: 49.99, stripe_id: "price_1S3042CHc12x7sCzRlzs0fzA" },
  CUMMERBUND: { price: 49.99, stripe_id: "price_1S30JUCHc12x7sCzTAqZiycN" },
  ACC_PREMIUM: { price: 69.99, stripe_id: "price_1S304CCHc12x7sCzI36HvfRg" },
  
  // OUTERWEAR
  JACKET_BLAZER: { price: 199.99, stripe_id: "price_1S304NCHc12x7sCzjEanqnkq" },
  JACKET_VELVET: { price: 229.99, stripe_id: "price_1S304bCHc12x7sCzOjFjAhwd" }
}

// Function to determine tier based on product name
function getTierForProduct(productTitle: string): string {
  const title = productTitle.toLowerCase()
  
  // BOY'S SUITS
  if (title.includes("stacy adams boy") || title.includes("boy's 5pc")) {
    return "SUIT_BOYS_STACY"
  }
  if (title.includes("boy") && title.includes("suit")) {
    return "SUIT_BOYS"
  }
  
  // TUXEDOS (check before suits)
  if (title.includes('tuxedo')) {
    if (title.includes('paisley') || title.includes('velvet') || title.includes('gold design')) {
      return "TUX_PREMIUM"
    }
    if (title.includes('double breasted')) {
      return "TUX_STANDARD"
    }
    if (title.includes('tone trim') || title.includes('shawl')) {
      return "TUX_STANDARD"
    }
    return "TUX_BASIC"
  }
  
  // SUITS
  if (title.includes('suit')) {
    if (title.includes('slim stretch') || title.includes('performance')) {
      return "SUIT_PREMIUM"
    }
    if (title.includes('double breasted') || title.includes('pin stripe') || 
        title.includes('fall') || title.includes('satin')) {
      return "SUIT_STANDARD"
    }
    return "SUIT_STANDARD" // Default most suits to standard
  }
  
  // BLAZERS & JACKETS
  if (title.includes('blazer')) {
    if (title.includes('velvet') || title.includes('sparkle')) {
      return "JACKET_VELVET"
    }
    return "JACKET_BLAZER"
  }
  if (title.includes('velvet') && title.includes('jacket')) {
    return "JACKET_VELVET"
  }
  
  // VESTS
  if (title.includes('vest')) {
    if (title.includes('sparkle') || title.includes('sequin') || title.includes('premium')) {
      return "VEST_PREMIUM"
    }
    return "VEST_STANDARD"
  }
  
  // SHIRTS
  if (title.includes('shirt')) {
    if (title.includes('ultra stretch') || title.includes('performance')) {
      return "SHIRT_PREMIUM"
    }
    if (title.includes('dress shirt') || title.includes('collarless')) {
      return "SHIRT_STANDARD"
    }
    return "SHIRT_BASIC"
  }
  
  // PANTS
  if (title.includes('pant') || title.includes('trouser')) {
    if (title.includes('stretch')) {
      return "PANTS_STRETCH"
    }
    if (title.includes('tapered') || title.includes('slim')) {
      return "PANTS_TAPERED"
    }
    return "PANTS_DRESS"
  }
  
  // SHOES
  if (title.includes('shoe') || title.includes('oxford') || title.includes('loafer')) {
    if (title.includes('spike')) {
      return "SHOES_SPIKES"
    }
    if (title.includes('velvet')) {
      return "SHOES_VELVET"
    }
    if (title.includes('premium') || title.includes('leather')) {
      return "SHOES_PREMIUM"
    }
    return "SHOES_DRESS"
  }
  
  // SWEATERS
  if (title.includes('sweater')) {
    if (title.includes('heavy') || title.includes('thick')) {
      return "HEAVY_SWEATERS"
    }
    if (title.includes('turtle')) {
      return "TURTLE_NECK"
    }
    if (title.includes('mock') || title.includes('moc')) {
      return "MOC_NECK"
    }
    return "SWEATERS"
  }
  
  // ACCESSORIES
  if (title.includes('suspender')) {
    if (title.includes('set') || title.includes('bowtie')) {
      return "ACC_SETS"
    }
    return "ACC_SUSPENDERS"
  }
  if (title.includes('cufflink')) {
    return "ACC_CUFFLINKS"
  }
  if (title.includes('pocket square')) {
    return "ACC_POCKET_SQUARE"
  }
  if (title.includes('sock')) {
    return "ACC_SOCKS"
  }
  if (title.includes('belt')) {
    return "ACC_BELT"
  }
  if (title.includes('tie clip') || title.includes('tie bar')) {
    return "ACC_TIE_CLIP"
  }
  if (title.includes('lapel')) {
    return "ACC_LAPEL_PIN"
  }
  if (title.includes('cummerbund')) {
    return "CUMMERBUND"
  }
  if (title.includes('glove')) {
    return "ACC_GLOVES"
  }
  if (title.includes('bow tie') || title.includes('bowtie')) {
    if (title.includes('set')) {
      return "ACC_SETS"
    }
    return "ACC_TIES"
  }
  
  // Default fallback based on current price if possible
  return "SUIT_STANDARD" // Safe default
}

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
    
    // Get ALL products
    const products = await productModuleService.listProducts({
      relations: ['variants'],
      take: 500
    })
    
    const updates = []
    const errors = []
    
    for (const product of products) {
      try {
        // Determine tier for this product
        const tierName = getTierForProduct(product.title)
        const tier = PRICING_TIERS[tierName]
        
        if (!tier) {
          errors.push({
            product: product.title,
            error: `No tier found for product`
          })
          continue
        }
        
        // Update product metadata with tier info
        const updatedProduct = await productModuleService.updateProducts(product.id, {
          metadata: {
            ...product.metadata,
            price_tier: tierName,
            stripe_price_id: tier.stripe_id,
            tier_price: tier.price
          }
        })
        
        // Update prices for all variants
        for (const variant of product.variants) {
          // Delete existing prices
          const existingPrices = await pricingModuleService.listPrices({
            variant_id: variant.id
          })
          
          if (existingPrices.length > 0) {
            await pricingModuleService.deletePrices(existingPrices.map(p => p.id))
          }
          
          // Create new prices for each region with tier price
          for (const region of regions) {
            await pricingModuleService.createPrices({
              title: `${tierName} - ${region.currency_code.toUpperCase()}`,
              currency_code: region.currency_code,
              amount: tier.price,
              variant_id: variant.id,
              rules: []
            })
          }
        }
        
        updates.push({
          product: product.title,
          tier: tierName,
          price: tier.price,
          stripe_id: tier.stripe_id
        })
        
      } catch (error: any) {
        errors.push({
          product: product.title,
          error: error.message
        })
      }
    }
    
    res.json({
      success: true,
      summary: {
        total_products: products.length,
        updated: updates.length,
        errors: errors.length
      },
      updates: updates,
      errors: errors,
      tier_distribution: updates.reduce((acc, u) => {
        acc[u.tier] = (acc[u.tier] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    })
    
  } catch (error: any) {
    console.error("[Map Products to Tiers] Error:", error)
    res.status(500).json({
      error: "Failed to map products to tiers",
      message: error.message
    })
  }
}

// GET endpoint to preview mapping without making changes
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get ALL products
    const products = await productModuleService.listProducts({
      relations: ['variants'],
      take: 500
    })
    
    const mappings = products.map(product => {
      const tierName = getTierForProduct(product.title)
      const tier = PRICING_TIERS[tierName]
      
      return {
        product_title: product.title,
        current_metadata: product.metadata,
        suggested_tier: tierName,
        tier_price: tier?.price || null,
        stripe_id: tier?.stripe_id || null
      }
    })
    
    const tierDistribution = mappings.reduce((acc, m) => {
      if (m.suggested_tier) {
        acc[m.suggested_tier] = (acc[m.suggested_tier] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    res.json({
      preview_mode: true,
      total_products: products.length,
      mappings: mappings.slice(0, 20), // Show first 20 as sample
      tier_distribution: tierDistribution,
      unmapped: mappings.filter(m => !m.stripe_id).map(m => m.product_title),
      instructions: "POST to this endpoint to apply these mappings"
    })
    
  } catch (error: any) {
    console.error("[Preview Tier Mapping] Error:", error)
    res.status(500).json({
      error: "Failed to preview tier mapping",
      message: error.message
    })
  }
}