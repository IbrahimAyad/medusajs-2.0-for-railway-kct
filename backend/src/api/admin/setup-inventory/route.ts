/**
 * Setup Inventory Management
 * Fixes all inventory issues and enables proper tracking
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Get all required services
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
    
    // Get stock locations
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    
    // Find Kalamazoo store location
    const kalamazooStore = stockLocations.find(
      (loc: any) => 
        loc.name?.includes('Kalamazoo') || 
        loc.name?.includes('213 S Kalamazoo') ||
        loc.address?.address_1?.includes('Kalamazoo')
    )
    
    if (!kalamazooStore) {
      return res.status(400).json({
        error: "Kalamazoo store location not found",
        locations: stockLocations.map((l: any) => ({
          id: l.id,
          name: l.name,
          address: l.address
        }))
      })
    }
    
    // Get all products with variants
    const products = await productModuleService.listProducts(
      {},
      {
        take: 500,
        relations: ["variants"]
      }
    )
    
    // Count current state
    const stats = {
      total_products: products.length,
      total_variants: products.reduce((sum: number, p: any) => sum + (p.variants?.length || 0), 0),
      products_with_variants: products.filter((p: any) => p.variants?.length > 0).length,
      stock_location: {
        id: kalamazooStore.id,
        name: kalamazooStore.name,
        address: kalamazooStore.address?.address_1
      }
    }
    
    res.json({
      message: "Ready to setup inventory",
      stats,
      next_step: "POST to this endpoint to enable inventory tracking",
      warning: "This will update all variants to manage_inventory: true and set 10 units per size"
    })
    
  } catch (error: any) {
    console.error("Setup inventory check error:", error)
    res.status(500).json({
      error: "Failed to check inventory setup",
      message: error.message
    })
  }
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const inventoryModuleService = req.scope.resolve(Modules.INVENTORY)
    const stockLocationModuleService = req.scope.resolve(Modules.STOCK_LOCATION)
    const remoteLink = req.scope.resolve("remoteLink")
    
    const DEFAULT_QUANTITY = 10 // 10 units per size
    
    // Get Kalamazoo store location
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    const kalamazooStore = stockLocations.find(
      (loc: any) => 
        loc.name?.includes('Kalamazoo') || 
        loc.name?.includes('213 S Kalamazoo')
    )
    
    if (!kalamazooStore) {
      return res.status(400).json({
        error: "Kalamazoo store location not found. Please create it first."
      })
    }
    
    // Get all products with variants
    const products = await productModuleService.listProducts(
      {},
      {
        take: 500,
        relations: ["variants", "variants.options"]
      }
    )
    
    const results = {
      total_products: products.length,
      total_variants: 0,
      variants_updated: 0,
      inventory_items_created: 0,
      inventory_levels_created: 0,
      errors: [] as any[],
      sample_updates: [] as any[]
    }
    
    // Process each product
    for (const product of products) {
      if (!product.variants || product.variants.length === 0) {
        continue
      }
      
      for (const variant of product.variants) {
        results.total_variants++
        
        try {
          // Step 1: Update variant to enable inventory management
          await productModuleService.updateProductVariants(variant.id, {
            manage_inventory: true
          })
          results.variants_updated++
          
          // Step 2: Check if inventory item exists or create it
          let inventoryItem = null
          
          // Try to find existing inventory item by SKU
          const existingItems = await inventoryModuleService.listInventoryItems({
            sku: variant.sku
          })
          
          if (existingItems.length > 0) {
            inventoryItem = existingItems[0]
          } else {
            // Create new inventory item
            inventoryItem = await inventoryModuleService.createInventoryItems({
              sku: variant.sku || `${product.handle}-${variant.id}`,
              title: `${product.title} - ${variant.title}`,
              requires_shipping: true
            })
            results.inventory_items_created++
          }
          
          // Step 3: Create link between variant and inventory item
          try {
            await remoteLink.create({
              productVariantId: variant.id,
              inventoryItemId: inventoryItem.id
            })
          } catch (linkError) {
            // Link might already exist, that's OK
          }
          
          // Step 4: Create or update inventory level at Kalamazoo store
          const existingLevels = await inventoryModuleService.listInventoryLevels({
            inventory_item_id: inventoryItem.id,
            location_id: kalamazooStore.id
          })
          
          if (existingLevels.length > 0) {
            // Update existing level
            await inventoryModuleService.updateInventoryLevels(existingLevels[0].id, {
              stocked_quantity: DEFAULT_QUANTITY
            })
          } else {
            // Create new inventory level
            await inventoryModuleService.createInventoryLevels({
              inventory_item_id: inventoryItem.id,
              location_id: kalamazooStore.id,
              stocked_quantity: DEFAULT_QUANTITY,
              reserved_quantity: 0
            })
            results.inventory_levels_created++
          }
          
          // Add to sample updates for first 5
          if (results.sample_updates.length < 5) {
            results.sample_updates.push({
              product: product.title,
              variant: variant.title,
              sku: variant.sku,
              inventory_item_id: inventoryItem.id,
              quantity_set: DEFAULT_QUANTITY
            })
          }
          
        } catch (variantError: any) {
          results.errors.push({
            product: product.title,
            variant: variant.title,
            error: variantError.message
          })
        }
      }
    }
    
    res.json({
      success: true,
      message: "Inventory setup completed",
      results
    })
    
  } catch (error: any) {
    console.error("Setup inventory error:", error)
    res.status(500).json({
      error: "Failed to setup inventory",
      message: error.message,
      stack: error.stack
    })
  }
}