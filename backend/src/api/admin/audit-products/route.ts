/**
 * Audit Products - Check what data we actually have
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Get sample products with all relations
    const products = await productModuleService.listProducts(
      {},
      {
        take: 5,
        relations: ["variants", "categories", "collections", "tags", "images", "options"]
      }
    )
    
    // Get all categories
    const categories = await productModuleService.listProductCategories({}, { take: 100 })
    
    // Get all collections
    const collections = await productModuleService.listProductCollections({}, { take: 100 })
    
    // Get all tags
    const tags = await productModuleService.listProductTags({}, { take: 100 })
    
    // Check inventory for first product's variants
    let inventoryData = []
    if (products[0]?.variants?.length > 0) {
      for (const variant of products[0].variants.slice(0, 3)) {
        try {
          const inventory = await inventoryModuleService.listInventoryItems(
            { sku: variant.sku },
            { take: 1 }
          )
          inventoryData.push({
            variant_id: variant.id,
            sku: variant.sku,
            inventory_found: inventory.length > 0,
            inventory: inventory[0] || null
          })
        } catch (e) {
          // Inventory might not exist
        }
      }
    }
    
    // Analyze what we have
    const audit = {
      summary: {
        total_products: await productModuleService.listProducts({}, { take: null }).then(p => p.length),
        total_categories: categories.length,
        total_collections: collections.length,
        total_tags: tags.length,
        products_with_variants: products.filter(p => p.variants && p.variants.length > 0).length,
        products_with_categories: products.filter(p => p.categories && p.categories.length > 0).length
      },
      
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        handle: c.handle,
        parent_id: c.parent_category_id
      })),
      
      collections: collections.map(c => ({
        id: c.id,
        title: c.title,
        handle: c.handle
      })),
      
      tags: tags.map(t => ({
        id: t.id,
        value: t.value
      })),
      
      sample_products: products.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        status: p.status,
        
        variants: p.variants?.map(v => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          barcode: v.barcode,
          options: v.options,
          inventory_quantity: (v as any).inventory_quantity || 0
        })) || [],
        
        categories: p.categories?.map(c => c.name) || [],
        collections: (p as any).collections?.map((c: any) => c.title) || [],
        tags: p.tags?.map(t => t.value) || [],
        
        options: p.options?.map(o => ({
          title: o.title,
          values: o.values
        })) || [],
        
        metadata: p.metadata || {},
        
        has_variants: (p.variants?.length || 0) > 0,
        has_categories: (p.categories?.length || 0) > 0,
        has_pricing: !!p.metadata?.pricing_tier
      })),
      
      inventory_check: inventoryData,
      
      issues_found: {
        products_without_variants: products.filter(p => !p.variants || p.variants.length === 0).map(p => p.title),
        products_without_categories: products.filter(p => !p.categories || p.categories.length === 0).map(p => p.title),
        products_without_sku: products.filter(p => p.variants?.some(v => !v.sku)).map(p => p.title)
      }
    }
    
    res.json(audit)
    
  } catch (error: any) {
    console.error("Audit error:", error)
    res.status(500).json({
      error: "Failed to audit products",
      message: error.message
    })
  }
}