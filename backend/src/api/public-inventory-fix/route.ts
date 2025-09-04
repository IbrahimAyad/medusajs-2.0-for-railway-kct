/**
 * TEMPORARY PUBLIC ENDPOINT - No Auth Required
 * One-time inventory fix
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
    
    // Get all products with variants
    const products = await productModuleService.listProducts(
      {},
      { take: 500, relations: ["variants"] }
    )
    
    const results = {
      total_products: products.length,
      variants_processed: 0,
      variants_updated: 0,
      inventory_created: 0,
      levels_created: 0,
      errors: [] as any[],
      sample_updates: [] as any[]
    }
    
    // Process each product
    for (const product of products) {
      if (!product.variants || product.variants.length === 0) continue
      
      for (const variant of product.variants) {
        try {
          results.variants_processed++
          
          // Enable inventory management
          await productModuleService.updateProductVariants(variant.id, {
            manage_inventory: true
          })
          results.variants_updated++
          
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
            // Link might exist
          }
          
          // Create or update inventory level
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
          } else {
            // Update existing level
            await inventoryModuleService.updateInventoryLevels([{
              id: existingLevels[0].id,
              inventory_item_id: inventoryItem.id,
              location_id: kalamazooStore.id,
              stocked_quantity: DEFAULT_QUANTITY
            }])
          }
          
          // Add sample for tracking
          if (results.sample_updates.length < 5) {
            results.sample_updates.push({
              product: product.title,
              variant: variant.title,
              sku: variant.sku,
              inventory_set: DEFAULT_QUANTITY
            })
          }
          
        } catch (error: any) {
          results.errors.push({
            variant: variant.id,
            error: error.message
          })
        }
      }
    }
    
    res.json({
      success: true,
      message: "Inventory setup completed",
      store_location: kalamazooStore.name,
      results
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: "Setup failed",
      message: error.message
    })
  }
}