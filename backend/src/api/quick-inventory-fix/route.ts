/**
 * QUICK INVENTORY FIX
 * Processes first 20 products only for testing
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
    const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
    const remoteLink = req.scope.resolve("remoteLink")
    
    const DEFAULT_QUANTITY = 10
    const BATCH_SIZE = 20 // Process only first 20 products
    
    // Get Kalamazoo store
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    const kalamazooStore = stockLocations.find((loc: any) => 
      loc.name?.includes('Kalamazoo') || loc.name?.includes('213 S Kalamazoo')
    )
    
    if (!kalamazooStore) {
      return res.json({ 
        error: "Kalamazoo store not found",
        locations: stockLocations.map((l: any) => ({ id: l.id, name: l.name }))
      })
    }
    
    // Get limited products
    const products = await productModuleService.listProducts(
      {},
      { take: BATCH_SIZE, relations: ["variants"] }
    )
    
    const results = {
      batch_size: BATCH_SIZE,
      products_processed: 0,
      variants_processed: 0,
      inventory_created: 0,
      levels_created: 0,
      samples: [] as any[]
    }
    
    // Process batch
    for (const product of products) {
      if (!product.variants || product.variants.length === 0) continue
      
      results.products_processed++
      
      for (const variant of product.variants) {
        try {
          results.variants_processed++
          
          // Enable inventory management
          await productModuleService.updateProductVariants(variant.id, {
            manage_inventory: true
          })
          
          // Create or find inventory item
          let inventoryItem = null
          const existingItems = await inventoryModuleService.listInventoryItems({
            sku: variant.sku
          })
          
          if (existingItems.length > 0) {
            inventoryItem = existingItems[0]
          } else {
            inventoryItem = await inventoryModuleService.createInventoryItems({
              sku: variant.sku || `${product.handle}-${variant.id}`,
              title: `${product.title} - ${variant.title}`,
              requires_shipping: true
            })
            results.inventory_created++
          }
          
          // Create link
          try {
            await remoteLink.create({
              product_variant_id: variant.id,
              inventory_item_id: inventoryItem.id
            } as any)
          } catch (e) {
            // Link exists
          }
          
          // Create inventory level
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
          }
          
          // Track samples
          if (results.samples.length < 3) {
            results.samples.push({
              product: product.title,
              variant: variant.title,
              quantity: DEFAULT_QUANTITY
            })
          }
          
        } catch (error: any) {
          console.error(`Error for variant ${variant.id}:`, error.message)
        }
      }
    }
    
    res.json({
      success: true,
      message: `Processed batch of ${BATCH_SIZE} products`,
      store: kalamazooStore.name,
      results,
      next_step: "Run /full-inventory-fix for all products"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: "Setup failed",
      message: error.message
    })
  }
}