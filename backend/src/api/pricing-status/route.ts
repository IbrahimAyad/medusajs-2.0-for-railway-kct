/**
 * Public Pricing Status Endpoint
 * Check the status of product pricing without authentication
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get sample products to check pricing status WITH variants
    const products = await productModuleService.listProducts(
      {}, // filters
      { 
        take: 5,
        relations: ["variants"] // Include variants in query
      }
    )
    
    const status = products.map((p: any) => ({
      id: p.id,
      title: p.title,
      has_tier: !!p.metadata?.pricing_tier,
      tier: p.metadata?.pricing_tier || "NOT_SET",
      price: p.metadata?.tier_price || 0,
      variant_count: p.variants?.length || 0
    }))
    
    // Count total products with pricing AND variants
    const allProducts = await productModuleService.listProducts(
      {},
      { 
        take: 500,
        relations: ["variants"]
      }
    )
    
    // Also get total variant count
    const allVariants = await productModuleService.listProductVariants(
      {},
      { take: 1000 }
    )
    
    const withPricing = allProducts.filter((p: any) => p.metadata?.pricing_tier)
    
    const withVariants = allProducts.filter((p: any) => p.variants && p.variants.length > 0)
    
    res.json({
      status: "ready",
      total_products: allProducts.length,
      total_variants: allVariants.length,
      products_with_pricing: withPricing.length,
      products_with_variants: withVariants.length,
      products_without_variants: allProducts.length - withVariants.length,
      products_without_pricing: allProducts.length - withPricing.length,
      sample_products: status,
      pricing_system: "Medusa Native PriceSets",
      tier_count: 45,
      message: withPricing.length === 0 ? 
        "No products have pricing yet. Run setup-product-pricing to apply." :
        `${withPricing.length} products have tier pricing, ${withVariants.length} have variants.`
    })
    
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: error.message
    })
  }
}