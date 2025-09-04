/**
 * Check Inventory Status - Public Endpoint
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
    const remoteLink = req.scope.resolve("remoteLink")
    
    // Get first 5 products to test
    const products = await productModuleService.listProducts(
      {},
      { take: 5, relations: ["variants"] }
    )
    
    const productStatus = await Promise.all(products.map(async (product: any) => {
      const variantStatus = await Promise.all((product.variants || []).map(async (variant: any) => {
        let inventoryInfo = {
          has_inventory: false,
          inventory_quantity: 0,
          inventory_item_id: null
        }
        
        try {
          // Check for inventory link
          const links = await remoteLink.list({
            product_variant_id: variant.id
          })
          
          if (links.length > 0 && (links[0] as any).inventory_item_id) {
            inventoryInfo.inventory_item_id = (links[0] as any).inventory_item_id
            inventoryInfo.has_inventory = true
            
            // Get inventory levels
            const inventoryLevels = await inventoryModuleService.listInventoryLevels({
              inventory_item_id: (links[0] as any).inventory_item_id
            })
            
            if (inventoryLevels.length > 0) {
              inventoryInfo.inventory_quantity = inventoryLevels[0].stocked_quantity - inventoryLevels[0].reserved_quantity
            }
          }
        } catch (e) {
          // No inventory
        }
        
        return {
          id: variant.id,
          title: variant.title,
          sku: variant.sku,
          manage_inventory: variant.manage_inventory,
          ...inventoryInfo
        }
      }))
      
      return {
        id: product.id,
        title: product.title,
        variants: variantStatus
      }
    }))
    
    // Count totals
    const totals = {
      total_products_checked: productStatus.length,
      total_variants: productStatus.reduce((sum, p) => sum + p.variants.length, 0),
      variants_with_inventory: productStatus.reduce((sum, p) => 
        sum + p.variants.filter(v => v.has_inventory).length, 0),
      variants_with_stock: productStatus.reduce((sum, p) => 
        sum + p.variants.filter(v => v.inventory_quantity > 0).length, 0),
      variants_manage_inventory_true: productStatus.reduce((sum, p) => 
        sum + p.variants.filter(v => v.manage_inventory).length, 0)
    }
    
    res.json({
      status: "inventory_check",
      totals,
      sample_products: productStatus
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to check inventory",
      message: error.message
    })
  }
}