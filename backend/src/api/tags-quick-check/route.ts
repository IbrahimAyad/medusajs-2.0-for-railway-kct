/**
 * Quick Tags and Collections Check
 * Lighter analysis of product organization
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get first 50 products as a sample
    const sampleProducts = await productModuleService.listProducts(
      {},
      { 
        take: 50,
        relations: ["categories", "tags"],
        select: ["id", "title", "handle", "tags", "categories", "metadata"]
      }
    )
    
    // Get total count
    const allProducts = await productModuleService.listProducts({}, { take: null })
    
    // Quick analysis
    let withTags = 0
    let withCategories = 0
    let withPricingTier = 0
    const categoriesFound = new Set<string>()
    const tagsFound = new Set<string>()
    const pricingTiers = new Set<string>()
    const sampleData = [] as any[]
    
    for (const product of sampleProducts) {
      const productInfo = {
        title: product.title,
        handle: product.handle,
        has_tags: false,
        has_categories: false,
        has_pricing: false,
        tags: [] as string[],
        categories: [] as string[],
        pricing_tier: null as string | null
      }
      
      // Check tags
      if (product.tags && product.tags.length > 0) {
        withTags++
        productInfo.has_tags = true
        productInfo.tags = product.tags.map((t: any) => t.value || t.name || t)
        product.tags.forEach((t: any) => tagsFound.add(t.value || t.name || t))
      }
      
      // Check categories
      if (product.categories && product.categories.length > 0) {
        withCategories++
        productInfo.has_categories = true
        productInfo.categories = product.categories.map((c: any) => c.name || c.handle)
        product.categories.forEach((c: any) => categoriesFound.add(c.name || c.handle))
      }
      
      // Check pricing tier in metadata
      if (product.metadata?.pricing_tier) {
        withPricingTier++
        productInfo.has_pricing = true
        const tierValue = String(product.metadata.pricing_tier)
        productInfo.pricing_tier = tierValue
        pricingTiers.add(tierValue)
      }
      
      if (sampleData.length < 10) {
        sampleData.push(productInfo)
      }
    }
    
    const percentWithTags = Math.round((withTags / sampleProducts.length) * 100)
    const percentWithCategories = Math.round((withCategories / sampleProducts.length) * 100)
    const percentWithPricing = Math.round((withPricingTier / sampleProducts.length) * 100)
    
    res.json({
      analysis: {
        sample_size: sampleProducts.length,
        total_products: allProducts.length,
        sample_results: {
          with_tags: withTags,
          with_categories: withCategories,
          with_pricing_tier: withPricingTier,
          percent_with_tags: percentWithTags + '%',
          percent_with_categories: percentWithCategories + '%',
          percent_with_pricing: percentWithPricing + '%'
        }
      },
      
      unique_values_found: {
        tags: Array.from(tagsFound),
        categories: Array.from(categoriesFound),
        pricing_tiers: Array.from(pricingTiers)
      },
      
      estimated_totals: {
        products_with_tags: Math.round((percentWithTags / 100) * allProducts.length),
        products_with_categories: Math.round((percentWithCategories / 100) * allProducts.length),
        products_with_pricing: Math.round((percentWithPricing / 100) * allProducts.length)
      },
      
      sample_products: sampleData,
      
      recommendation: percentWithTags < 50 ? 
        "⚠️ Most products lack tags. Consider adding tags for better organization." :
        "✅ Products are well-tagged for organization."
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: "Analysis failed",
      message: error.message
    })
  }
}