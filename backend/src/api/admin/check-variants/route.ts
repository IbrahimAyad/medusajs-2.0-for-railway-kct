/**
 * Check Variants - Deep dive into what variants actually exist
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // First, get total counts
    const allProducts = await productModuleService.listProducts({}, { take: 500 })
    const allVariants = await productModuleService.listProductVariants({}, { take: 1000 })
    
    // Get a few products WITH their variants using correct relations
    const productsWithVariants = await productModuleService.listProducts(
      {},
      {
        take: 10,
        relations: ["variants", "variants.options", "options", "options.values"]
      }
    )
    
    // Check for orphaned variants (variants without products)
    const variantsByProduct = new Map()
    for (const variant of allVariants) {
      const productId = variant.product_id
      if (!variantsByProduct.has(productId)) {
        variantsByProduct.set(productId, [])
      }
      variantsByProduct.get(productId).push(variant)
    }
    
    // Find products with most variants
    const topProducts = Array.from(variantsByProduct.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([productId, variants]) => {
        const product = allProducts.find(p => p.id === productId)
        return {
          product_id: productId,
          product_title: product?.title || "Unknown",
          variant_count: variants.length,
          variant_details: variants.slice(0, 3).map(v => ({
            id: v.id,
            title: v.title,
            sku: v.sku,
            options: v.options
          }))
        }
      })
    
    const report = {
      summary: {
        total_products: allProducts.length,
        total_variants: allVariants.length,
        products_with_variants: variantsByProduct.size,
        products_without_variants: allProducts.length - variantsByProduct.size,
        average_variants_per_product: allVariants.length / (variantsByProduct.size || 1)
      },
      
      sample_products: productsWithVariants.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        variant_count: p.variants?.length || 0,
        options: p.options?.map(o => ({
          title: o.title,
          values: o.values?.map(v => v.value) || []
        })) || [],
        variants: p.variants?.slice(0, 5).map(v => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          barcode: v.barcode,
          options: v.options
        })) || []
      })),
      
      top_products_by_variants: topProducts,
      
      variant_samples: allVariants.slice(0, 10).map(v => ({
        id: v.id,
        product_id: v.product_id,
        title: v.title,
        sku: v.sku,
        options: v.options,
        created_at: v.created_at
      })),
      
      issues: {
        products_without_variants: allProducts
          .filter(p => !variantsByProduct.has(p.id))
          .slice(0, 10)
          .map(p => ({ id: p.id, title: p.title })),
        
        variants_without_sku: allVariants
          .filter(v => !v.sku)
          .slice(0, 10)
          .map(v => ({ id: v.id, title: v.title }))
      }
    }
    
    res.json(report)
    
  } catch (error: any) {
    console.error("Check variants error:", error)
    res.status(500).json({
      error: "Failed to check variants",
      message: error.message
    })
  }
}