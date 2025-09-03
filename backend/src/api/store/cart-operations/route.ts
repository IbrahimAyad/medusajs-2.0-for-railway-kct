/**
 * Store Cart Operations
 * Public endpoints for cart management
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Create or retrieve cart
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { action, cart_id, variant_id, quantity = 1, customer_email } = req.body
    const cartModuleService = req.scope.resolve(Modules.CART)
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    switch (action) {
      case "create":
        // Create new cart
        const newCart = await cartModuleService.createCarts({
          currency_code: "usd",
          email: customer_email,
          region_id: req.body.region_id || "default-region"
        })
        
        return res.json({
          success: true,
          cart_id: newCart.id,
          cart: newCart
        })
        
      case "add_item":
        // Get variant details
        const variants = await productModuleService.listProductVariants(
          { id: variant_id },
          { take: 1 }
        )
        
        if (!variants.length) {
          return res.status(404).json({
            success: false,
            error: "Variant not found"
          })
        }
        
        const variant = variants[0]
        
        // Add item to cart
        await cartModuleService.addLineItems({
          cart_id,
          items: [{
            variant_id,
            quantity,
            unit_price: variant.calculated_price?.calculated_amount || 0,
            title: variant.title || "Product"
          }]
        })
        
        // Get updated cart
        const updatedCart = await cartModuleService.retrieveCart(cart_id, {
          relations: ["items", "items.variant"]
        })
        
        return res.json({
          success: true,
          cart: updatedCart
        })
        
      case "update_item":
        // Update line item quantity
        const { item_id } = req.body
        
        await cartModuleService.updateLineItems(cart_id, [{
          id: item_id,
          quantity
        }])
        
        const cartAfterUpdate = await cartModuleService.retrieveCart(cart_id, {
          relations: ["items"]
        })
        
        return res.json({
          success: true,
          cart: cartAfterUpdate
        })
        
      case "remove_item":
        // Remove line item
        await cartModuleService.deleteLineItems([req.body.item_id])
        
        const cartAfterRemove = await cartModuleService.retrieveCart(cart_id, {
          relations: ["items"]
        })
        
        return res.json({
          success: true,
          cart: cartAfterRemove
        })
        
      case "get":
        // Get cart details
        const cart = await cartModuleService.retrieveCart(cart_id, {
          relations: ["items", "items.variant", "items.variant.product"]
        })
        
        return res.json({
          success: true,
          cart
        })
        
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action"
        })
    }
    
  } catch (error: any) {
    console.error("Cart operation error:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

// Get cart by ID
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const cart_id = req.query.cart_id as string
    
    if (!cart_id) {
      return res.status(400).json({
        success: false,
        error: "cart_id is required"
      })
    }
    
    const cartModuleService = req.scope.resolve(Modules.CART)
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: ["items", "items.variant", "items.variant.product", "shipping_address"]
    })
    
    res.json({
      success: true,
      cart
    })
    
  } catch (error: any) {
    console.error("Get cart error:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}