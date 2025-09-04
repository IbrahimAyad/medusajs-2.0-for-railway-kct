/**
 * Test Single Product Inventory Setup
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
    
    // Get stock location
    const stockLocations = await stockLocationModuleService.listStockLocations({})
    const kalamazooStore = stockLocations.find((loc: any) => 
      loc.name?.includes('Kalamazoo') || loc.name?.includes('213 S')
    )
    
    if (!kalamazooStore) {
      return res.json({ 
        error: "Store not found",
        locations: stockLocations.map((l: any) => l.name)
      })
    }
    
    // Get ONE product only
    const products = await productModuleService.listProducts(
      {},
      { take: 1, relations: ["variants"] }
    )
    
    if (products.length === 0) {
      return res.json({ error: "No products found" })
    }
    
    const product = products[0]
    const variant = product.variants?.[0]
    
    if (!variant) {
      return res.json({ error: "No variant found" })
    }
    
    const result = {
      product: product.title,
      variant: variant.title,
      variant_id: variant.id,
      sku: variant.sku,
      steps: [] as string[]
    }
    
    try {
      // Step 1: Enable manage_inventory
      result.steps.push("Enabling manage_inventory...")
      await productModuleService.updateProductVariants(variant.id, {
        manage_inventory: true
      })
      result.steps.push("✓ manage_inventory enabled")
      
      // Step 2: Create or find inventory item
      result.steps.push("Finding/creating inventory item...")
      let inventoryItem = null
      
      // Check if it exists
      const existingItems = await inventoryModuleService.listInventoryItems({
        sku: variant.sku
      })
      
      if (existingItems.length > 0) {
        inventoryItem = existingItems[0]
        result.steps.push(`✓ Found existing inventory item: ${inventoryItem.id}`)
      } else {
        inventoryItem = await inventoryModuleService.createInventoryItems({
          sku: variant.sku || `test-${variant.id}`,
          title: `${product.title} - ${variant.title}`,
          requires_shipping: true
        })
        result.steps.push(`✓ Created inventory item: ${inventoryItem.id}`)
      }
      
      // Step 3: Link variant to inventory
      result.steps.push("Creating link...")
      try {
        await remoteLink.create({
          product_variant_id: variant.id,
          inventory_item_id: inventoryItem.id
        } as any)
        result.steps.push("✓ Link created")
      } catch (e: any) {
        result.steps.push(`⚠️ Link error: ${e.message}`)
      }
      
      // Step 4: Create or update inventory level
      result.steps.push("Setting inventory level...")
      
      const existingLevels = await inventoryModuleService.listInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: kalamazooStore.id
      })
      
      if (existingLevels.length > 0) {
        await inventoryModuleService.updateInventoryLevels([{
          id: existingLevels[0].id,
          inventory_item_id: inventoryItem.id,
          location_id: kalamazooStore.id,
          stocked_quantity: 10
        }])
        result.steps.push("✓ Updated inventory level to 10 units")
      } else {
        await inventoryModuleService.createInventoryLevels([{
          inventory_item_id: inventoryItem.id,
          location_id: kalamazooStore.id,
          stocked_quantity: 10
        }])
        result.steps.push("✓ Created inventory level with 10 units")
      }
      
      // Verify
      const levels = await inventoryModuleService.listInventoryLevels({
        inventory_item_id: inventoryItem.id
      })
      
      result.steps.push(`✓ Verified: ${levels[0].stocked_quantity} units at ${kalamazooStore.name}`)
      
    } catch (error: any) {
      result.steps.push(`ERROR: ${error.message}`)
      return res.status(500).json({ error: error.message, result })
    }
    
    res.json({
      success: true,
      message: "Single product inventory setup complete",
      result
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  }
}