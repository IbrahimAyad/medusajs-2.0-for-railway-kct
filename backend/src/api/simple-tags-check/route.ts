/**
 * Simple Tags Check - No relations
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get products without relations
    const products = await productModuleService.listProducts(
      {},
      { 
        take: 20,
        select: ["id", "title", "handle", "metadata", "tags", "categories", "collection_id", "type_id"]
      }
    )
    
    const results = products.map((product: any) => ({
      title: product.title,
      handle: product.handle,
      has_collection_id: !!product.collection_id,
      has_type_id: !!product.type_id,
      has_tags_field: !!product.tags,
      has_categories_field: !!product.categories,
      pricing_tier: product.metadata?.pricing_tier || "none",
      metadata_count: Object.keys(product.metadata || {}).length
    }))
    
    const summary = {
      checked: results.length,
      with_collection_id: results.filter(p => p.has_collection_id).length,
      with_type_id: results.filter(p => p.has_type_id).length,
      with_pricing_tier: results.filter(p => p.pricing_tier !== "none").length,
      with_metadata: results.filter(p => p.metadata_count > 0).length
    }
    
    res.json({
      summary,
      sample: results.slice(0, 5)
    })
    
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}