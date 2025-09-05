/**
 * Products Tags and Collections Analysis
 * Analyzes all products for tags and collections
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get all products with their relations
    const products = await productModuleService.listProducts(
      {},
      { 
        take: 500,
        relations: ["categories", "collections", "tags", "type"],
        select: ["id", "title", "handle", "tags", "categories", "collections", "type", "metadata"]
      }
    )
    
    // Analysis data
    const analysis = {
      total_products: products.length,
      products_with_tags: 0,
      products_with_collections: 0,
      products_with_categories: 0,
      products_with_type: 0,
      products_with_metadata: 0,
      products_with_nothing: 0,
      
      // Unique values
      all_tags: new Set<string>(),
      all_collections: new Set<string>(),
      all_categories: new Set<string>(),
      all_types: new Set<string>(),
      
      // Sample products
      sample_products_with_tags: [] as any[],
      sample_products_without_tags: [] as any[],
      products_by_category: {} as Record<string, number>,
      products_by_collection: {} as Record<string, number>
    }
    
    // Analyze each product
    for (const product of products) {
      let hasOrganization = false
      
      // Check tags
      if (product.tags && product.tags.length > 0) {
        analysis.products_with_tags++
        hasOrganization = true
        
        product.tags.forEach((tag: any) => {
          analysis.all_tags.add(tag.value || tag.name || tag)
        })
        
        if (analysis.sample_products_with_tags.length < 5) {
          analysis.sample_products_with_tags.push({
            title: product.title,
            handle: product.handle,
            tags: product.tags.map((t: any) => t.value || t.name || t)
          })
        }
      }
      
      // Check collection (singular in Medusa v2)
      if (product.collection) {
        analysis.products_with_collections++
        hasOrganization = true
        
        const collName = product.collection.title || product.collection.handle
        analysis.all_collections.add(collName)
        analysis.products_by_collection[collName] = (analysis.products_by_collection[collName] || 0) + 1
      }
      
      // Check categories  
      if (product.categories && product.categories.length > 0) {
        analysis.products_with_categories++
        hasOrganization = true
        
        product.categories.forEach((category: any) => {
          const catName = category.name || category.handle
          analysis.all_categories.add(catName)
          analysis.products_by_category[catName] = (analysis.products_by_category[catName] || 0) + 1
        })
      }
      
      // Check type
      if (product.type) {
        analysis.products_with_type++
        hasOrganization = true
        const typeValue = typeof product.type === 'string' ? product.type : product.type.value
        analysis.all_types.add(typeValue)
      }
      
      // Check metadata
      if (product.metadata && Object.keys(product.metadata).length > 0) {
        analysis.products_with_metadata++
      }
      
      // Track products without organization
      if (!hasOrganization) {
        analysis.products_with_nothing++
        if (analysis.sample_products_without_tags.length < 5) {
          analysis.sample_products_without_tags.push({
            title: product.title,
            handle: product.handle
          })
        }
      }
    }
    
    // Convert sets to arrays for JSON response
    const summary = {
      overview: {
        total_products: analysis.total_products,
        products_with_tags: analysis.products_with_tags,
        products_with_collections: analysis.products_with_collections,
        products_with_categories: analysis.products_with_categories,
        products_with_type: analysis.products_with_type,
        products_with_metadata: analysis.products_with_metadata,
        products_unorganized: analysis.products_with_nothing
      },
      
      percentages: {
        with_tags: Math.round((analysis.products_with_tags / analysis.total_products) * 100) + '%',
        with_collections: Math.round((analysis.products_with_collections / analysis.total_products) * 100) + '%',
        with_categories: Math.round((analysis.products_with_categories / analysis.total_products) * 100) + '%',
        unorganized: Math.round((analysis.products_with_nothing / analysis.total_products) * 100) + '%'
      },
      
      unique_values: {
        tags_count: analysis.all_tags.size,
        tags: Array.from(analysis.all_tags).slice(0, 20),
        collections_count: analysis.all_collections.size,
        collections: Array.from(analysis.all_collections),
        categories_count: analysis.all_categories.size,
        categories: Array.from(analysis.all_categories),
        types_count: analysis.all_types.size,
        types: Array.from(analysis.all_types)
      },
      
      distribution: {
        by_category: analysis.products_by_category,
        by_collection: analysis.products_by_collection
      },
      
      samples: {
        with_tags: analysis.sample_products_with_tags,
        without_organization: analysis.sample_products_without_tags
      }
    }
    
    res.json(summary)
    
  } catch (error: any) {
    res.status(500).json({
      error: "Analysis failed",
      message: error.message
    })
  }
}