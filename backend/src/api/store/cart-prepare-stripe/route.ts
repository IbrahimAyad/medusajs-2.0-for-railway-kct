/**
 * Prepare Cart for Stripe Payment
 * Ensures cart has all required data before payment initialization
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
    
    // Get the cart with all necessary relations
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: [
        'shipping_address',
        'billing_address',
        'items',
        'items.product',
        'items.variant',
        'shipping_methods',
        'payment_collection'
      ]
    })
    
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      })
    }
    
    // Check what's missing
    const issues = []
    const fixes = []
    
    // 1. Check email
    if (!cart.email) {
      issues.push("Missing email")
      // Set a default email if needed for testing
      const defaultEmail = req.body.email || "customer@example.com"
      await cartModuleService.updateCart(cart_id, {
        email: defaultEmail
      })
      fixes.push(`Set email to ${defaultEmail}`)
    }
    
    // 2. Check shipping address
    if (!cart.shipping_address) {
      issues.push("Missing shipping address")
      
      // Add default shipping address for testing
      const defaultAddress = {
        first_name: req.body.first_name || "Test",
        last_name: req.body.last_name || "Customer",
        address_1: req.body.address_1 || "123 Test St",
        address_2: req.body.address_2 || "",
        city: req.body.city || "New York",
        country_code: req.body.country_code || "us",
        postal_code: req.body.postal_code || "10001",
        phone: req.body.phone || "+1234567890",
        province: req.body.province || "NY"
      }
      
      await cartModuleService.updateCart(cart_id, {
        shipping_address: defaultAddress
      })
      fixes.push("Added shipping address")
    }
    
    // 3. Check billing address
    if (!cart.billing_address) {
      issues.push("Missing billing address")
      
      // Use shipping address as billing address
      const billingAddress = cart.shipping_address || {
        first_name: req.body.first_name || "Test",
        last_name: req.body.last_name || "Customer",
        address_1: req.body.address_1 || "123 Test St",
        address_2: req.body.address_2 || "",
        city: req.body.city || "New York",
        country_code: req.body.country_code || "us",
        postal_code: req.body.postal_code || "10001",
        phone: req.body.phone || "+1234567890",
        province: req.body.province || "NY"
      }
      
      await cartModuleService.updateCart(cart_id, {
        billing_address: billingAddress
      })
      fixes.push("Added billing address")
    }
    
    // 4. Check shipping methods
    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      issues.push("Missing shipping method")
      // This needs to be added through the shipping options endpoint
      // Can't directly add here
    }
    
    // 5. Check total amount
    const totalAmount = Number(cart.total)
    if (totalAmount < 50) { // Stripe minimum is 50 cents
      issues.push(`Total too low: ${totalAmount} cents (minimum 50)`)
    }
    
    // 6. Initialize payment collection if needed
    let paymentCollection = cart.payment_collection
    let paymentCollectionCreated = false
    
    if (!paymentCollection) {
      try {
        // Create payment collection with proper amount
        const amountInCents = Math.max(totalAmount * 100, 50) // Ensure minimum 50 cents
        
        paymentCollection = await paymentModuleService.createPaymentCollections({
          currency_code: cart.currency_code || 'usd',
          amount: amountInCents, // Amount in cents for Stripe
          metadata: {
            cart_id: cart.id,
            resource_id: cart.id,
            resource_type: "cart"
          }
        })
        
        paymentCollectionCreated = true
        fixes.push("Created payment collection")
        
      } catch (error: any) {
        console.error("Failed to create payment collection:", error)
        return res.status(500).json({
          error: "Failed to create payment collection",
          details: error.message
        })
      }
    }
    
    // 7. Try to initialize payment session with Stripe
    let stripeSessionResult = null
    let stripeError = null
    
    if (paymentCollection && issues.filter(i => !i.includes("shipping method")).length === 0) {
      try {
        // Initialize payment sessions
        const sessions = await paymentModuleService.listPaymentSessions({
          payment_collection_id: paymentCollection.id
        })
        
        if (sessions.length === 0) {
          // Create Stripe payment session
          const amountInCents = Math.max(Number(cart.total) * 100, 50)
          
          const sessionData = {
            provider_id: 'pp_stripe_stripe',
            currency_code: cart.currency_code || 'usd',
            amount: amountInCents,
            context: {
              email: cart.email,
              address: {
                first_name: cart.shipping_address?.first_name,
                last_name: cart.shipping_address?.last_name,
                line1: cart.shipping_address?.address_1,
                line2: cart.shipping_address?.address_2,
                city: cart.shipping_address?.city,
                state: cart.shipping_address?.province,
                postal_code: cart.shipping_address?.postal_code,
                country: cart.shipping_address?.country_code
              }
            },
            data: {
              customer_email: cart.email
            }
          }
          
          console.log("Creating Stripe session with data:", JSON.stringify(sessionData, null, 2))
          
          const stripeSession = await paymentModuleService.createPaymentSession(
            paymentCollection.id,
            sessionData
          )
          
          stripeSessionResult = {
            success: true,
            session_id: stripeSession.id,
            provider_id: stripeSession.provider_id,
            status: stripeSession.status
          }
          fixes.push("Created Stripe payment session")
          
        } else {
          stripeSessionResult = {
            success: true,
            existing_sessions: sessions.length,
            session_ids: sessions.map(s => s.id)
          }
        }
        
      } catch (error: any) {
        console.error("Stripe session error:", error)
        stripeError = {
          message: error.message,
          type: error.type,
          code: error.code,
          details: error.response?.data || error.stack?.split('\n').slice(0, 3)
        }
      }
    }
    
    // Get updated cart
    const updatedCart = await cartModuleService.retrieveCart(cart_id, {
      relations: ['shipping_address', 'billing_address', 'payment_collection']
    })
    
    res.json({
      success: issues.length === 0 || fixes.length > 0,
      cart_id: cart.id,
      original_issues: issues,
      fixes_applied: fixes,
      cart_status: {
        has_email: !!updatedCart.email,
        has_shipping_address: !!updatedCart.shipping_address,
        has_billing_address: !!updatedCart.billing_address,
        has_shipping_method: updatedCart.shipping_methods?.length > 0,
        total_amount: Number(updatedCart.total),
        total_in_cents: Number(updatedCart.total) * 100,
        currency: updatedCart.currency_code
      },
      payment_status: {
        collection_id: paymentCollection?.id,
        collection_created: paymentCollectionCreated,
        stripe_session: stripeSessionResult,
        stripe_error: stripeError
      },
      next_steps: issues.length > 0 ? 
        `Fix remaining issues: ${issues.join(', ')}` :
        stripeSessionResult?.success ?
        "Cart is ready for Stripe checkout" :
        "Cart prepared but Stripe session failed - check stripe_error for details"
    })
    
  } catch (error: any) {
    console.error("[Cart Prepare Stripe] Error:", error)
    res.status(500).json({
      error: "Failed to prepare cart for Stripe",
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    })
  }
}