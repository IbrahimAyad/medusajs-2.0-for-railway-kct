/**
 * Store Products API
 * Public endpoint for fetching products with pricing
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const remoteLink = req.scope.resolve("remoteLink")
    const cacheService = req.scope.resolve(Modules.CACHE)
    
    // Parse query parameters
    const {
      limit = "20",
      offset = "0",
      category,
      search,
      min_price,
      max_price,
      sort = "created_at"
    } = req.query as Record<string, string>
    
    // Create cache key from query parameters
    const cacheKey = `products:${limit}:${offset}:${category || ''}:${search || ''}:${min_price || ''}:${max_price || ''}:${sort}`
    
    // Try to get from cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      // Set cache headers for CDN
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      res.set('X-Cache', 'HIT')
      return res.json(cached)
    }
    
    // Build filters
    const filters: any = {}
    if (category) {
      filters.categories = { handle: category }
    }
    if (search) {
      filters.$or = [
        { title: { $ilike: `%${search}%` } },
        { description: { $ilike: `%${search}%` } }
      ]
    }
    
    // Get products
    const products = await productModuleService.listProducts(
      filters,
      {
        take: parseInt(limit),
        skip: parseInt(offset),
        order: { [sort]: "DESC" },
        relations: ["variants", "images", "categories"]
      }
    )
    
    // Get total count for pagination
    const count = await productModuleService.listProducts(
      filters,
      { take: null }
    )
    
    // Format products with pricing from metadata and proper inventory
    const formattedProducts = await Promise.all(products.map(async (product: any) => {
      // Get inventory for each variant
      const variantsWithInventory = await Promise.all((product.variants || []).map(async (v: any) => {
        let inventoryQuantity = 0
        
        try {
          // First try the link approach
          try {
            const links = await remoteLink.list({
              product_variant_id: v.id
            })
            
            if (links.length > 0 && (links[0] as any).inventory_item_id) {
              const inventoryLevels = await inventoryModuleService.listInventoryLevels({
                inventory_item_id: (links[0] as any).inventory_item_id
              })
              
              if (inventoryLevels.length > 0) {
                inventoryQuantity = inventoryLevels[0].stocked_quantity - inventoryLevels[0].reserved_quantity
              }
            }
          } catch (linkError) {
            // Link approach failed, try by SKU
          }
          
          // If no inventory from link, try finding by SKU
          if (inventoryQuantity === 0 && v.sku) {
            const inventoryItems = await inventoryModuleService.listInventoryItems({
              sku: v.sku
            })
            
            if (inventoryItems.length > 0) {
              const inventoryLevels = await inventoryModuleService.listInventoryLevels({
                inventory_item_id: inventoryItems[0].id
              })
              
              if (inventoryLevels.length > 0) {
                inventoryQuantity = inventoryLevels[0].stocked_quantity - inventoryLevels[0].reserved_quantity
              }
            }
          }
        } catch (error) {
          // If no inventory, default to 0
          console.log(`No inventory for variant ${v.id}`)
        }
        
        return {
          id: v.id,
          title: v.title,
          sku: v.sku,
          barcode: v.barcode,
          inventory_quantity: inventoryQuantity,
          options: v.options,
          manage_inventory: v.manage_inventory || false
        }
      }))
      
      return {
        id: product.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        images: product.images,
        categories: product.categories,
        pricing_tier: product.metadata?.pricing_tier,
        price: product.metadata?.tier_price || 0,
        variants: variantsWithInventory
      }
    }))
    
    // Apply price filters if provided
    let filteredProducts = formattedProducts
    if (min_price) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(min_price))
    }
    if (max_price) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(max_price))
    }
    
    const response = {
      products: filteredProducts,
      count: filteredProducts.length,
      total: count.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
    
    // Cache the response for 60 seconds
    await cacheService.set(cacheKey, response, 60)
    
    // Set cache headers for CDN
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.set('X-Cache', 'MISS')
    
    res.json(response)
    
  } catch (error: any) {
    console.error("Products fetch error:", error)
    res.status(500).json({
      error: error.message,
      products: [],
      count: 0
    })
  }
}

interface ProductRequest extends MedusaRequest {
  body: {
    product_id: string
  }
}

// Get single product by ID
export const POST = async (
  req: ProductRequest,
  res: MedusaResponse
) => {
  try {
    const { product_id } = req.body
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const remoteLink = req.scope.resolve("remoteLink")
    
    const product = await productModuleService.retrieveProduct(product_id, {
      relations: ["variants", "images", "categories"]
    })
    
    // Get inventory for variants
    const variantsWithInventory = await Promise.all((product.variants || []).map(async (v: any) => {
      let inventoryQuantity = 0
      
      try {
        // Try link approach first
        try {
          const links = await remoteLink.list({
            product_variant_id: v.id
          })
          
          if (links.length > 0 && (links[0] as any).inventory_item_id) {
            const inventoryLevels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: (links[0] as any).inventory_item_id
            })
            
            if (inventoryLevels.length > 0) {
              inventoryQuantity = inventoryLevels[0].stocked_quantity - inventoryLevels[0].reserved_quantity
            }
          }
        } catch (linkError) {
          // Link failed, try SKU
        }
        
        // Fallback to SKU-based lookup
        if (inventoryQuantity === 0 && v.sku) {
          const inventoryItems = await inventoryModuleService.listInventoryItems({
            sku: v.sku
          })
          
          if (inventoryItems.length > 0) {
            const inventoryLevels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: inventoryItems[0].id
            })
            
            if (inventoryLevels.length > 0) {
              inventoryQuantity = inventoryLevels[0].stocked_quantity - inventoryLevels[0].reserved_quantity
            }
          }
        }
      } catch (error) {
        console.log(`No inventory for variant ${v.id}`)
      }
      
      return {
        id: v.id,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        inventory_quantity: inventoryQuantity,
        options: v.options,
        price: product.metadata?.tier_price || 0,
        manage_inventory: v.manage_inventory || false
      }
    }))
    
    const formattedProduct = {
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      handle: product.handle,
      thumbnail: product.thumbnail,
      images: product.images,
      categories: product.categories,
      pricing_tier: product.metadata?.pricing_tier,
      price: product.metadata?.tier_price || 0,
      variants: variantsWithInventory
    }
    
    res.json({
      product: formattedProduct
    })
    
  } catch (error: any) {
    console.error("Product fetch error:", error)
    res.status(500).json({
      error: error.message,
      product: null
    })
  }
}