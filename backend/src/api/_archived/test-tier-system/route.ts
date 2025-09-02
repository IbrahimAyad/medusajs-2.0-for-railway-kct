/**
 * Test Tier System - Public endpoint to verify tier mapping
 * No authentication required for testing
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get first 10 products to check their metadata
    const products = await productModuleService.listProducts({
      take: 10,
      relations: ['variants']
    })
    
    // Check how many have tier metadata
    const productsWithTiers = products.filter(p => 
      p.metadata?.tier && p.metadata?.stripe_price_id
    )
    
    // Get all products count
    const allProducts = await productModuleService.listProducts({
      take: 500
    })
    
    const allWithTiers = allProducts.filter(p => 
      p.metadata?.tier && p.metadata?.stripe_price_id
    )
    
    res.json({
      test: "tier_system_check",
      total_products: allProducts.length,
      products_with_tiers: allWithTiers.length,
      products_without_tiers: allProducts.length - allWithTiers.length,
      sample_products: products.map(p => ({
        id: p.id,
        title: p.title,
        has_tier: !!p.metadata?.tier,
        tier: p.metadata?.tier || null,
        tier_price: p.metadata?.tier_price || null,
        has_stripe_id: !!p.metadata?.stripe_price_id,
        stripe_id_preview: p.metadata?.stripe_price_id ? 
          (p.metadata.stripe_price_id as string).substring(0, 30) + '...' : null,
        variant_prices: p.variants?.map(v => ({
          title: v.title,
          sku: v.sku,
          price_count: 0 // Would need to check pricing module
        }))
      })),
      tier_coverage: allWithTiers.length > 0 ? 
        `${((allWithTiers.length / allProducts.length) * 100).toFixed(1)}%` : 
        "0%",
      next_step: allWithTiers.length === 0 ? 
        "Run POST /admin/map-products-to-tiers to map all products" :
        allWithTiers.length < allProducts.length ?
          "Some products mapped. Run mapping again to complete." :
          "All products mapped to tiers!"
    })
    
  } catch (error: any) {
    console.error("[Test Tier System] Error:", error)
    res.status(500).json({
      error: "Failed to test tier system",
      message: error.message
    })
  }
}