/**
 * Sample Products Tags Check
 * Check just 10 products for tags and collections
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get just 10 products
    const products = await productModuleService.listProducts(
      {},
      { 
        take: 10,
        relations: ["categories", "tags"],
        select: ["id", "title", "handle", "metadata"]
      }
    )
    
    const results = products.map((product: any) => ({
      title: product.title,
      handle: product.handle,
      tags: product.tags || [],
      categories: product.categories || [],
      has_tags: product.tags && product.tags.length > 0,
      has_categories: product.categories && product.categories.length > 0,
      pricing_tier: product.metadata?.pricing_tier || null,
      metadata_keys: Object.keys(product.metadata || {})
    }))
    
    const summary = {
      products_checked: results.length,
      with_tags: results.filter(p => p.has_tags).length,
      with_categories: results.filter(p => p.has_categories).length,
      with_pricing_tier: results.filter(p => p.pricing_tier).length
    }
    
    res.json({
      summary,
      products: results
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    })
  }
}