/**
 * Inventory Summary - Check how many products have inventory
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
    
    // Get all products
    const allProducts = await productModuleService.listProducts(
      {},
      { take: 500, relations: ["variants"] }
    )
    
    let totalVariants = 0
    let variantsWithInventory = 0
    let variantsWithStock = 0
    let productsWithInventory = 0
    let productsWithStock = 0
    const sampleProductsWithStock = [] as any[]
    
    for (const product of allProducts) {
      let productHasInventory = false
      let productHasStock = false
      let productStock = 0
      
      for (const variant of (product.variants || [])) {
        totalVariants++
        
        if (variant.sku) {
          try {
            const inventoryItems = await inventoryModuleService.listInventoryItems({
              sku: variant.sku
            })
            
            if (inventoryItems.length > 0) {
              variantsWithInventory++
              productHasInventory = true
              
              const inventoryLevels = await inventoryModuleService.listInventoryLevels({
                inventory_item_id: inventoryItems[0].id
              })
              
              if (inventoryLevels.length > 0 && inventoryLevels[0].stocked_quantity > 0) {
                variantsWithStock++
                productHasStock = true
                productStock += inventoryLevels[0].stocked_quantity
              }
            }
          } catch (e) {
            // Skip errors
          }
        }
      }
      
      if (productHasInventory) productsWithInventory++
      if (productHasStock) {
        productsWithStock++
        if (sampleProductsWithStock.length < 10) {
          sampleProductsWithStock.push({
            title: product.title,
            variants: product.variants?.length || 0,
            total_stock: productStock
          })
        }
      }
    }
    
    const percentComplete = Math.round((productsWithStock / allProducts.length) * 100)
    
    res.json({
      summary: {
        total_products: allProducts.length,
        products_with_inventory_items: productsWithInventory,
        products_with_stock: productsWithStock,
        percent_complete: percentComplete,
        total_variants: totalVariants,
        variants_with_inventory: variantsWithInventory,
        variants_with_stock: variantsWithStock
      },
      status: percentComplete === 100 ? "✅ Complete!" : `${percentComplete}% complete`,
      sample_products: sampleProductsWithStock,
      missing: allProducts.length - productsWithStock
    })
    
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}