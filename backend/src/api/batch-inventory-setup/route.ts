/**
 * Batch Inventory Setup - Process products in small batches
 * GET: Check status
 * POST: Process next batch
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

interface BatchRequest extends MedusaRequest {
  query: {
    batch_size?: string
    offset?: string
  }
}

export const GET = async (
  req: BatchRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
    
    // Get total products
    const allProducts = await productModuleService.listProducts({}, { take: null })
    const totalProducts = allProducts.length
    
    // Get products with inventory
    const productsWithInventory = []
    let variantsWithInventory = 0
    let totalVariants = 0
    
    // Sample first 10 products to check inventory status
    const sampleProducts = await productModuleService.listProducts(
      {},
      { take: 10, relations: ["variants"] }
    )
    
    for (const product of sampleProducts) {
      totalVariants += (product.variants?.length || 0)
      
      let hasInventory = false
      for (const variant of (product.variants || [])) {
        if (variant.sku) {
          const items = await inventoryModuleService.listInventoryItems({ sku: variant.sku })
          if (items.length > 0) {
            const levels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: items[0].id
            })
            if (levels.length > 0 && levels[0].stocked_quantity > 0) {
              variantsWithInventory++
              hasInventory = true
            }
          }
        }
      }
      
      if (hasInventory) {
        productsWithInventory.push(product.title)
      }
    }
    
    // Get stock location
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    const kalamazooStore = stockLocations.find((loc: any) => 
      loc.name?.includes('Kalamazoo') || loc.name?.includes('213 S')
    )
    
    res.json({
      status: "ready",
      total_products: totalProducts,
      sample_check: {
        products_checked: sampleProducts.length,
        products_with_inventory: productsWithInventory.length,
        variants_checked: totalVariants,
        variants_with_inventory: variantsWithInventory,
        sample_products: productsWithInventory.slice(0, 3)
      },
      store_location: kalamazooStore ? {
        id: kalamazooStore.id,
        name: kalamazooStore.name
      } : null,
      next_action: "POST with ?batch_size=10&offset=0 to start processing"
    })
    
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

export const POST = async (
  req: BatchRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
    
    const batchSize = parseInt(req.query.batch_size || "10")
    const offset = parseInt(req.query.offset || "0")
    const DEFAULT_QUANTITY = 10
    
    // Get stock location
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    const kalamazooStore = stockLocations.find((loc: any) => 
      loc.name?.includes('Kalamazoo') || loc.name?.includes('213 S')
    )
    
    if (!kalamazooStore) {
      return res.status(400).json({ error: "Kalamazoo store not found" })
    }
    
    // Get batch of products
    const products = await productModuleService.listProducts(
      {},
      {
        take: batchSize,
        skip: offset,
        relations: ["variants"],
        order: { created_at: "ASC" }
      }
    )
    
    if (products.length === 0) {
      return res.json({
        success: true,
        message: "No more products to process",
        batch_complete: true
      })
    }
    
    const results = {
      batch_size: batchSize,
      offset: offset,
      products_processed: 0,
      variants_processed: 0,
      inventory_created: 0,
      levels_created: 0,
      errors: [] as any[],
      processed_products: [] as string[]
    }
    
    // Process each product in batch
    for (const product of products) {
      if (!product.variants || product.variants.length === 0) continue
      
      results.products_processed++
      results.processed_products.push(product.title)
      
      for (const variant of product.variants) {
        try {
          results.variants_processed++
          
          // Enable inventory management if not already
          if (!variant.manage_inventory) {
            await productModuleService.updateProductVariants(variant.id, {
              manage_inventory: true
            })
          }
          
          // Check/create inventory item
          let inventoryItem = null
          if (variant.sku) {
            const existingItems = await inventoryModuleService.listInventoryItems({
              sku: variant.sku
            })
            
            if (existingItems.length > 0) {
              inventoryItem = existingItems[0]
            } else {
              inventoryItem = await inventoryModuleService.createInventoryItems({
                sku: variant.sku,
                title: `${product.title} - ${variant.title}`,
                requires_shipping: true
              })
              results.inventory_created++
            }
            
            // Check/create inventory level
            const existingLevels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: inventoryItem.id,
              location_id: kalamazooStore.id
            })
            
            if (existingLevels.length === 0) {
              await inventoryModuleService.createInventoryLevels([{
                inventory_item_id: inventoryItem.id,
                location_id: kalamazooStore.id,
                stocked_quantity: DEFAULT_QUANTITY
              }])
              results.levels_created++
            } else if (existingLevels[0].stocked_quantity === 0) {
              // Update if quantity is 0
              await inventoryModuleService.updateInventoryLevels([{
                id: existingLevels[0].id,
                inventory_item_id: inventoryItem.id,
                location_id: kalamazooStore.id,
                stocked_quantity: DEFAULT_QUANTITY
              }])
            }
          }
          
        } catch (error: any) {
          results.errors.push({
            product: product.title,
            variant: variant.title,
            error: error.message
          })
        }
      }
    }
    
    // Check if there are more products
    const allProducts = await productModuleService.listProducts({}, { take: null })
    const hasMore = (offset + batchSize) < allProducts.length
    
    res.json({
      success: true,
      message: `Processed batch ${Math.floor(offset / batchSize) + 1}`,
      results,
      progress: {
        current_offset: offset,
        next_offset: hasMore ? offset + batchSize : null,
        total_products: allProducts.length,
        products_remaining: Math.max(0, allProducts.length - (offset + batchSize)),
        percent_complete: Math.round(((offset + batchSize) / allProducts.length) * 100)
      },
      next_action: hasMore 
        ? `POST with ?batch_size=${batchSize}&offset=${offset + batchSize}` 
        : "All products processed!"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: "Batch processing failed",
      message: error.message
    })
  }
}