/**
 * Test Product Inventory Display
 * Public endpoint to verify inventory is working
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
    
    // Get Mint Vest product
    const products = await productModuleService.listProducts(
      { title: { $ilike: "%Mint Vest%" } },
      { take: 1, relations: ["variants"] }
    )
    
    if (products.length === 0) {
      return res.json({ error: "Mint Vest product not found" })
    }
    
    const product = products[0]
    
    // Check inventory for each variant using SKU
    const variantsWithInventory = await Promise.all((product.variants || []).map(async (v: any) => {
      let inventoryInfo = {
        variant_id: v.id,
        title: v.title,
        sku: v.sku,
        manage_inventory: v.manage_inventory,
        has_inventory_item: false,
        inventory_quantity: 0,
        location: null as string | null
      }
      
      try {
        if (v.sku) {
          // Find inventory item by SKU
          const inventoryItems = await inventoryModuleService.listInventoryItems({
            sku: v.sku
          })
          
          if (inventoryItems.length > 0) {
            inventoryInfo.has_inventory_item = true
            
            // Get inventory levels
            const inventoryLevels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: inventoryItems[0].id
            })
            
            if (inventoryLevels.length > 0) {
              const level = inventoryLevels[0]
              inventoryInfo.inventory_quantity = level.stocked_quantity - level.reserved_quantity
              inventoryInfo.location = level.location_id
            }
          }
        }
      } catch (error: any) {
        console.error(`Error checking inventory for ${v.sku}:`, error.message)
      }
      
      return inventoryInfo
    }))
    
    // Count summary
    const summary = {
      total_variants: variantsWithInventory.length,
      variants_with_inventory_items: variantsWithInventory.filter(v => v.has_inventory_item).length,
      variants_with_stock: variantsWithInventory.filter(v => v.inventory_quantity > 0).length,
      total_stock: variantsWithInventory.reduce((sum, v) => sum + v.inventory_quantity, 0)
    }
    
    res.json({
      success: true,
      product: {
        id: product.id,
        title: product.title,
        handle: product.handle,
        price: product.metadata?.tier_price || 0
      },
      summary,
      variants: variantsWithInventory
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    })
  }
}