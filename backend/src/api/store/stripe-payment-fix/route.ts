/**
 * Stripe Payment Fix
 * Alternative approach to create Stripe payment session with proper data format
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { cart_id, return_url } = req.body as { 
      cart_id: string
      return_url?: string 
    }
    
    if (!cart_id) {
      return res.status(400).json({
        error: "cart_id is required"
      })
    }
    
    const cartModuleService = req.scope.resolve(Modules.CART)
    const paymentModuleService = req.scope.resolve(Modules.PAYMENT)
    
    // Get cart details
    const cart = await cartModuleService.retrieveCart(cart_id, {
      relations: [
        'items',
        'items.product', 
        'items.variant',
        'shipping_address',
        'billing_address',
        'shipping_methods'
      ]
    })
    
    if (!cart) {
      return res.status(404).json({
        error: "Cart not found"
      })
    }
    
    // Initialize Stripe directly
    const stripeKey = process.env.STRIPE_API_KEY
    if (!stripeKey) {
      return res.status(500).json({
        error: "Stripe not configured"
      })
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.acacia' as any
    })
    
    // Prepare line items for Stripe
    const lineItems = cart.items.map(item => ({
      price_data: {
        currency: cart.currency_code || 'usd',
        product_data: {
          name: item.product?.title || item.title || 'Product',
          description: item.variant?.title || undefined,
          metadata: {
            variant_id: item.variant_id,
            product_id: item.product_id
          }
        },
        unit_amount: Math.round(Number(item.unit_price) * 100) // Convert to cents
      },
      quantity: item.quantity
    }))
    
    // Calculate shipping amount
    const shippingAmount = cart.shipping_methods?.reduce((sum, method) => {
      return sum + Number(method.amount || 0)
    }, 0) || 0
    
    // Add shipping as a line item if present
    if (shippingAmount > 0) {
      lineItems.push({
        price_data: {
          currency: cart.currency_code || 'usd',
          product_data: {
            name: 'Shipping',
            description: cart.shipping_methods?.[0]?.name || 'Standard Shipping'
          },
          unit_amount: Math.round(shippingAmount * 100) // Convert to cents
        },
        quantity: 1
      })
    }
    
    // Create Stripe checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: return_url || `${process.env.STORE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.STORE_URL || 'http://localhost:3000'}/cart`,
        customer_email: cart.email || undefined,
        shipping_address_collection: cart.shipping_address ? undefined : {
          allowed_countries: ['US', 'CA', 'GB']
        },
        billing_address_collection: cart.billing_address ? 'auto' : 'required',
        metadata: {
          cart_id: cart.id,
          medusa_cart_id: cart.id,
          source: 'medusa_storefront'
        },
        shipping_options: cart.shipping_address && !cart.shipping_methods?.length ? [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 1000, // $10 default shipping
                currency: cart.currency_code || 'usd'
              },
              display_name: 'Standard Shipping'
            }
          }
        ] : undefined
      })
      
      // Store the session ID in payment collection metadata
      try {
        let paymentCollection = cart.payment_collection
        
        if (!paymentCollection) {
          // Create payment collection
          paymentCollection = await paymentModuleService.createPaymentCollections({
            currency_code: cart.currency_code || 'usd',
            amount: Math.round(Number(cart.total) * 100), // Amount in cents
            metadata: {
              cart_id: cart.id,
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent
            }
          })
        } else {
          // Update existing collection with Stripe session info
          await paymentModuleService.updatePaymentCollections(
            paymentCollection.id,
            {
              metadata: {
                ...paymentCollection.metadata,
                stripe_session_id: session.id,
                stripe_payment_intent: session.payment_intent
              }
            }
          )
        }
      } catch (collectionError: any) {
        console.error("Payment collection error (non-fatal):", collectionError)
        // Continue even if payment collection fails - Stripe session is created
      }
      
      res.json({
        success: true,
        checkout_url: session.url,
        session_id: session.id,
        payment_intent: session.payment_intent,
        amount_total: session.amount_total,
        currency: session.currency,
        status: session.status,
        payment_status: session.payment_status,
        instructions: "Redirect customer to checkout_url to complete payment"
      })
      
    } catch (stripeError: any) {
      console.error("Stripe session creation error:", stripeError)
      res.status(500).json({
        error: "Failed to create Stripe checkout session",
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        param: stripeError.param,
        decline_code: stripeError.decline_code
      })
    }
    
  } catch (error: any) {
    console.error("[Stripe Payment Fix] Error:", error)
    res.status(500).json({
      error: "Failed to process payment",
      message: error.message
    })
  }
}