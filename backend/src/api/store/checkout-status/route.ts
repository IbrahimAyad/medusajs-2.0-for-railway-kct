/**
 * Checkout Status - Check if cart is ready for payment
 * Works with Medusa v2 payment flow
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { cart_id } = req.body as { cart_id: string }
    
    if (!cart_id) {
      return res.status(400).json({
        error: "cart_id is required"
      })
    }
    
    const cartModuleService = req.scope.resolve(Modules.CART)
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
    
    // Get cart
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: ['items', 'shipping_address', 'billing_address', 'shipping_methods']
    })
    
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      })
    }
    
    // Check cart requirements
    const requirements = {
      has_items: cart.items && cart.items.length > 0,
      has_email: !!cart.email,
      has_shipping_address: !!cart.shipping_address,
      has_billing_address: !!cart.billing_address,
      has_shipping_method: cart.shipping_methods && cart.shipping_methods.length > 0,
      has_valid_total: Number(cart.total) > 0
    }
    
    const isReady = Object.values(requirements).every(req => req === true)
    
    // Check payment providers
    const providers = await paymentModuleService.listPaymentProviders()
    const stripeProvider = providers.find((p: any) => 
      p.id === 'pp_stripe_stripe' || p.id === 'stripe'
    )
    
    res.json({
      cart_ready: isReady,
      requirements,
      missing: Object.entries(requirements)
        .filter(([_, value]) => !value)
        .map(([key]) => key),
      cart_summary: {
        id: cart.id,
        email: cart.email || null,
        currency: cart.currency_code,
        total: cart.total,
        subtotal: cart.subtotal,
        tax_total: cart.tax_total,
        shipping_total: cart.shipping_total,
        item_count: cart.items?.length || 0
      },
      payment: {
        stripe_available: !!stripeProvider,
        provider_id: stripeProvider?.id || null,
        providers_count: providers.length
      },
      next_steps: isReady ? 
        ["Initialize payment session", "Confirm payment with Stripe"] :
        ["Fix missing requirements", "Use /store/prepare-cart endpoint"]
    })
    
  } catch (error: any) {
    console.error("[Checkout Status] Error:", error)
    res.status(500).json({
      error: "Failed to check checkout status",
      message: error.message
    })
  }
}