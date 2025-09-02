/**
 * Prepare Cart for Checkout
 * Ensures cart has all required data for payment processing
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

interface CartPrepareRequest {
  cart_id: string
  email?: string
  shipping_address?: any
  billing_address?: any
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const body = req.body as CartPrepareRequest
    const { cart_id } = body
    
    if (!cart_id) {
      return res.status(400).json({
        error: "cart_id is required"
      })
    }
    
    const cartModuleService = req.scope.resolve(Modules.CART)
    
    // Get cart details
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: ['items', 'shipping_address', 'billing_address', 'shipping_methods']
    })
    
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      })
    }
    
    const updates: any = {
      id: cart_id
    }
    const fixes: string[] = []
    
    // Check and fix email
    if (!cart.email) {
      updates.email = body.email || "customer@example.com"
      fixes.push(`Set email to ${updates.email}`)
    }
    
    // Check and fix shipping address
    if (!cart.shipping_address) {
      updates.shipping_address = body.shipping_address || {
        first_name: "Test",
        last_name: "Customer",
        address_1: "123 Test St",
        address_2: "",
        city: "New York",
        country_code: "us",
        postal_code: "10001",
        phone: "+1234567890",
        province: "NY"
      }
      fixes.push("Added shipping address")
    }
    
    // Check and fix billing address
    if (!cart.billing_address) {
      updates.billing_address = body.billing_address || updates.shipping_address || {
        first_name: "Test",
        last_name: "Customer",
        address_1: "123 Test St",
        address_2: "",
        city: "New York",
        country_code: "us",
        postal_code: "10001",
        phone: "+1234567890",
        province: "NY"
      }
      fixes.push("Added billing address")
    }
    
    // Apply updates if needed - CORRECT API USAGE
    if (Object.keys(updates).length > 1) { // More than just id
      await cartModuleService.updateCarts([updates])
    }
    
    // Get updated cart
    const updatedCart = await cartModuleService.retrieveCart(cart_id, {
      relations: ['items', 'shipping_address', 'billing_address', 'shipping_methods']
    })
    
    res.json({
      success: true,
      cart_id: updatedCart.id,
      ready_for_payment: !!(updatedCart.email && updatedCart.shipping_address && updatedCart.billing_address),
      fixes_applied: fixes,
      cart_summary: {
        email: updatedCart.email,
        has_shipping_address: !!updatedCart.shipping_address,
        has_billing_address: !!updatedCart.billing_address,
        has_shipping_method: updatedCart.shipping_methods?.length > 0,
        item_count: updatedCart.items?.length || 0,
        total: updatedCart.total
      }
    })
    
  } catch (error: any) {
    console.error("[Prepare Cart] Error:", error)
    res.status(500).json({
      error: "Failed to prepare cart",
      message: error.message
    })
  }
}