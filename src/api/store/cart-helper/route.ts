import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService, IPaymentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { action, ...data } = req.body
  
  const cartService = req.scope.resolve<ICartModuleService>(Modules.CART)
  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)

  try {
    switch (action) {
      case "create_cart_with_items": {
        // Create cart with proper workflow
        const { region_id, items, email, currency_code } = data
        
        // 1. Create cart
        const cart = await cartService.createCarts({
          region_id,
          currency_code: currency_code || "usd",
          email,
        })
        
        // 2. Add items to cart (without payment collection requirement)
        if (items && items.length > 0) {
          for (const item of items) {
            try {
              await cartService.addLineItems({
                cart_id: cart.id,
                items: [{
                  variant_id: item.variant_id,
                  quantity: item.quantity
                }]
              })
            } catch (itemError) {
              console.log("Item add error (non-critical):", itemError.message)
            }
          }
        }
        
        // 3. Retrieve full cart with items
        const fullCart = await cartService.retrieveCart(cart.id, {
          relations: ["items", "items.variant", "items.product"]
        })
        
        return res.json({
          success: true,
          cart: fullCart
        })
      }
      
      case "add_item": {
        const { cart_id, variant_id, quantity } = data
        
        try {
          // Try to add item directly
          await cartService.addLineItems({
            cart_id,
            items: [{
              variant_id,
              quantity: quantity || 1
            }]
          })
          
          const cart = await cartService.retrieveCart(cart_id, {
            relations: ["items", "items.variant"]
          })
          
          return res.json({
            success: true,
            cart
          })
        } catch (error) {
          // If it fails due to payment collection, try to handle it
          return res.json({
            success: false,
            error: error.message,
            hint: "Try using 'prepare_checkout' action first"
          })
        }
      }
      
      case "prepare_checkout": {
        const { cart_id, shipping_address, billing_address } = data
        
        // Update addresses if provided
        if (shipping_address || billing_address) {
          await cartService.updateCarts({
            id: cart_id,
            shipping_address: shipping_address || billing_address,
            billing_address: billing_address || shipping_address
          })
        }
        
        // Initialize payment collection (this enables adding items)
        const paymentCollections = await paymentService.listPaymentCollections({
          cart_id: cart_id
        })
        
        let paymentCollection
        if (paymentCollections.length === 0) {
          paymentCollection = await paymentService.createPaymentCollections({
            cart_id,
            region_id: data.region_id || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD",
            currency_code: data.currency_code || "usd",
            amount: data.amount || 0
          })
        } else {
          paymentCollection = paymentCollections[0]
        }
        
        const cart = await cartService.retrieveCart(cart_id, {
          relations: ["items", "shipping_address", "billing_address"]
        })
        
        return res.json({
          success: true,
          cart,
          payment_collection_id: paymentCollection.id
        })
      }
      
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action. Use: create_cart_with_items, add_item, or prepare_checkout"
        })
    }
  } catch (error) {
    console.error("Cart helper error:", error)
    return res.status(400).json({
      success: false,
      error: error.message,
      details: error
    })
  }
}