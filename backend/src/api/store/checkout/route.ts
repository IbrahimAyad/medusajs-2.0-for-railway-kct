/**
 * Checkout Flow for Medusa Products
 * Handles payment session initialization and order completion
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { action, cart_id, ...data } = req.body
    const cartModuleService = req.scope.resolve(Modules.CART)
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    switch (action) {
      case "add_shipping_address":
        // Add shipping address to cart
        await cartModuleService.updateCarts([{
          id: cart_id,
          shipping_address: {
            first_name: data.first_name,
            last_name: data.last_name,
            address_1: data.address_1,
            address_2: data.address_2,
            city: data.city,
            province: data.state,
            postal_code: data.postal_code,
            country_code: data.country_code || "us",
            phone: data.phone
          },
          email: data.email
        }])
        
        const cartWithAddress = await cartModuleService.retrieveCart(cart_id)
        
        return res.json({
          success: true,
          cart: cartWithAddress
        })
        
      case "add_shipping_method":
        // Add shipping method (simplified for now)
        await cartModuleService.addShippingMethods({
          cart_id,
          methods: [{
            name: data.shipping_method || "Standard Shipping",
            amount: data.shipping_amount || 10
          }]
        })
        
        const cartWithShipping = await cartModuleService.retrieveCart(cart_id)
        
        return res.json({
          success: true,
          cart: cartWithShipping
        })
        
      case "initialize_payment":
        // Initialize payment session with Stripe
        const cart = await cartModuleService.retrieveCart(cart_id, {
          relations: ["items", "shipping_address"]
        })
        
        // Calculate total
        const subtotal = cart.items?.reduce((sum: number, item: any) => {
          return sum + (item.unit_price * item.quantity)
        }, 0) || 0
        
        const shipping = 10 // Fixed shipping for now
        const total = subtotal + shipping
        
        // Create payment collection
        const paymentCollection = await paymentModuleService.createPaymentCollections({
          amount: total * 100, // Convert to cents for Stripe
          currency_code: "usd",
          region_id: cart.region_id || "default-region"
        })
        
        // Initialize payment session with Stripe
        const paymentSession = await paymentModuleService.createPaymentSession(
          paymentCollection.id,
          {
            provider_id: "pp_stripe_stripe",
            currency_code: "usd",
            amount: total * 100,
            data: {
              customer: {
                email: cart.email
              }
            }
          }
        )
        
        // Authorize payment session to get client secret
        const authorized = await paymentModuleService.authorizePaymentSession(
          paymentSession.id,
          {}
        )
        
        return res.json({
          success: true,
          payment_collection_id: paymentCollection.id,
          payment_session_id: paymentSession.id,
          client_secret: authorized.data?.client_secret,
          amount: total,
          cart: cart
        })
        
      case "complete_order":
        // Complete the order after successful payment
        const { payment_intent_id, payment_collection_id } = data
        
        // Retrieve cart
        const finalCart = await cartModuleService.retrieveCart(cart_id, {
          relations: ["items", "items.variant", "shipping_address"]
        })
        
        // Create order
        const order = await orderModuleService.createOrders({
          currency_code: "usd",
          email: finalCart.email,
          shipping_address: finalCart.shipping_address,
          items: finalCart.items?.map((item: any) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            title: item.title
          })),
          payment_collection_id,
          status: "pending"
        })
        
        // Mark cart as completed
        await cartModuleService.updateCarts([{
          id: cart_id,
          completed_at: new Date()
        }])
        
        return res.json({
          success: true,
          order_id: order.id,
          order: order,
          message: "Order placed successfully!"
        })
        
      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action"
        })
    }
    
  } catch (error: any) {
    console.error("Checkout error:", error)
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    })
  }
}