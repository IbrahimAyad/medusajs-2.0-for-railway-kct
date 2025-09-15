import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { StripeProviderService } from "../../../../../services/stripe-provider"

/**
 * ENHANCED STRIPE PAYMENT SESSION CREATION
 * 
 * Uses custom Stripe provider service with fallback to direct Stripe API.
 * Handles amount conversion from BigNumber to proper integer format.
 * Bypasses broken @medusajs/payment-stripe module system.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cartId } = req.params
  const { provider_id = "stripe" } = req.body as any
  
  console.log(`[STRIPE ENHANCED] Creating payment session for cart ${cartId}`)
  
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    
    // Try to resolve custom Stripe provider or create one directly
    let stripeProvider: StripeProviderService | null = null
    try {
      stripeProvider = req.scope.resolve('stripe') as StripeProviderService
      console.log(`[STRIPE ENHANCED] ✅ Custom Stripe provider resolved`)
    } catch (stripeResolveError) {
      console.log(`[STRIPE ENHANCED] ⚠️ Custom Stripe provider not available, creating directly`)
      
      // Create custom Stripe provider directly
      const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY
      if (stripeKey) {
        try {
          stripeProvider = new StripeProviderService(req.scope, {
            apiKey: stripeKey,
            webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            capture: true,
            automatic_payment_methods: true,
            payment_description: 'Order from KCT Menswear'
          })
          console.log(`[STRIPE ENHANCED] ✅ Custom Stripe provider created directly`)
        } catch (createError) {
          console.log(`[STRIPE ENHANCED] ❌ Failed to create custom provider:`, createError.message)
        }
      }
    }
    
    // Get cart with payment collection
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id",
        "total",
        "currency_code",
        "region_id",
        "customer_id",
        "payment_collection.*",
        "payment_collection.payment_sessions.*"
      ],
    })
    
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }
    
    // Enhanced amount conversion to handle BigNumber objects properly
    const convertAmount = (amount: any): number => {
      // First log what we're receiving for debugging
      console.log(`[STRIPE ENHANCED] Raw amount type: ${typeof amount}`)
      console.log(`[STRIPE ENHANCED] Raw amount value:`, JSON.stringify(amount, null, 2))
      
      if (typeof amount === 'object' && amount !== null) {
        // Handle Medusa v2 BigNumber/MikroORM numeric objects
        if (amount.raw_ && amount.raw_.value !== undefined) {
          // This is a MikroORM numeric type
          const value = parseFloat(amount.raw_.value)
          console.log(`[STRIPE ENHANCED] Extracted from raw_.value: ${value}`)
          return Math.round(value)
        }
        
        // Handle numeric_ property
        if (amount.numeric_ !== undefined) {
          const value = parseFloat(amount.numeric_)
          console.log(`[STRIPE ENHANCED] Extracted from numeric_: ${value}`)
          return Math.round(value)
        }
        
        // Handle BigNumber objects with toNumber method
        if ('toNumber' in amount && typeof amount.toNumber === 'function') {
          const value = amount.toNumber()
          console.log(`[STRIPE ENHANCED] Extracted via toNumber(): ${value}`)
          return Math.round(value)
        }
        
        // Handle objects with toString method
        if ('toString' in amount && typeof amount.toString === 'function') {
          const str = amount.toString()
          // Avoid parsing object representations like "[object Object]"
          if (!str.includes('[object')) {
            const value = parseFloat(str)
            console.log(`[STRIPE ENHANCED] Extracted via toString(): ${value}`)
            return Math.round(value)
          }
        }
      }
      
      // Simple conversion for numbers and strings
      const numAmount = Number(amount)
      if (!isNaN(numAmount)) {
        console.log(`[STRIPE ENHANCED] Direct conversion: ${numAmount}`)
        return Math.round(numAmount)
      }
      
      console.error(`[STRIPE ENHANCED] Could not convert amount to number:`, amount)
      return 0
    }
    
    const amountInCents = convertAmount(cart.total)
    console.log(`[STRIPE ENHANCED] Cart total: ${amountInCents} cents ($${amountInCents/100})`)
    
    // Validate cart has items and valid total
    if (amountInCents <= 0) {
      console.error(`[STRIPE ENHANCED] Cart has invalid total: ${cart.total}`)
      return res.status(400).json({ 
        error: "Cart is empty or has invalid total. Please add items to your cart.",
        cart_total: String(cart.total),
        cart_id: cartId
      })
    }
    
    // Stripe requires minimum amount of 50 cents
    if (amountInCents < 50) {
      console.error(`[STRIPE ENHANCED] Cart total below Stripe minimum: ${amountInCents} cents`)
      return res.status(400).json({ 
        error: "Cart total must be at least $0.50",
        cart_total: amountInCents / 100,
        minimum_required: 0.50
      })
    }
    
    // Create or get payment collection
    let paymentCollectionId = cart.payment_collection?.id
    if (!paymentCollectionId) {
      const collection = await paymentService.createPaymentCollections({
        cart_id: cartId,
        region_id: cart.region_id,
        currency_code: cart.currency_code,
        amount: amountInCents // Properly converted to integer cents
      } as any)
      paymentCollectionId = (collection as any).id
      console.log(`[STRIPE ENHANCED] Created payment collection ${paymentCollectionId}`)
    }
    
    // For fresh checkout experience, always create new payment intent
    // Skip checking for existing sessions to avoid stale payment data
    console.log(`[STRIPE ENHANCED] Creating fresh payment session`)
    
    // For Stripe, use custom provider or fallback to direct API
    if (provider_id === "stripe") {
      
      // Method 1: Try custom Stripe provider first
      if (stripeProvider) {
        try {
          console.log(`[STRIPE ENHANCED] Using custom Stripe provider`)
          
          const paymentResponse = await stripeProvider.initiatePayment({
            amount: amountInCents,
            currency_code: cart.currency_code || 'usd',
            context: {}
          })
          
          if ('error' in paymentResponse) {
            throw new Error(`Custom Stripe provider error: ${paymentResponse.error}`)
          }
          
          console.log(`[STRIPE ENHANCED] ✅ Custom provider created payment intent:`, paymentResponse.id)
          
          // Create payment session in Medusa using custom provider response
          const session = await paymentService.createPaymentSession(
            paymentCollectionId,
            {
              provider_id: provider_id,
              currency_code: cart.currency_code,
              amount: amountInCents,
              data: paymentResponse.data,
              context: {
                cart_id: cartId
              }
            } as any
          )
          
          return res.json({
            payment_session: {
              ...session,
              data: {
                id: paymentResponse.id,
                client_secret: paymentResponse.data?.client_secret
              }
            },
            payment_collection_id: paymentCollectionId,
            stripe_amount: amountInCents,
            stripe_amount_usd: amountInCents / 100,
            provider_used: 'custom_stripe_provider'
          })
          
        } catch (customProviderError: any) {
          console.error(`[STRIPE ENHANCED] Custom provider failed:`, customProviderError.message)
          console.log(`[STRIPE ENHANCED] Falling back to direct Stripe API`)
          // Continue to fallback method
        }
      }
      
      // Method 2: Fallback to direct Stripe API
      const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY
      console.log(`[STRIPE ENHANCED] Stripe key exists: ${!!stripeKey}`)
      
      if (!stripeKey) {
        console.error(`[STRIPE ENHANCED] ERROR: Stripe API key not configured`)
        throw new Error("Stripe API key not configured")
      }
      
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2025-08-27.basil'
        })
        
        console.log(`[STRIPE ENHANCED] Creating PaymentIntent with amount: ${amountInCents}`)
        
        // Create payment intent with CORRECT amount (no multiplication!)
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents, // Already in cents, NO MULTIPLICATION!
          currency: cart.currency_code || 'usd',
          capture_method: 'automatic', // Use automatic capture for Medusa 2.0 standard flow
          metadata: {
            cart_id: cartId,
            resource_id: cartId
          },
          automatic_payment_methods: {
            enabled: true
          },
          description: 'Order from KCT Menswear'
        })
        
        console.log(`[STRIPE ENHANCED] ✅ Direct API created PaymentIntent ${paymentIntent.id} for ${amountInCents} cents`)
        
        // Create payment session in Medusa
        const session = await paymentService.createPaymentSession(
          paymentCollectionId,
          {
            provider_id: provider_id,
            currency_code: cart.currency_code,
            amount: amountInCents,
            data: {
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret,
              status: paymentIntent.status
            },
            context: {}
          } as any
        )
        
        console.log(`[STRIPE ENHANCED] ✅ Created payment session ${session.id}`)
        
        return res.json({
          payment_session: {
            ...session,
            data: {
              id: paymentIntent.id,
              client_secret: paymentIntent.client_secret
            }
          },
          payment_collection_id: paymentCollectionId,
          stripe_amount: amountInCents,
          stripe_amount_usd: amountInCents / 100,
          provider_used: 'direct_stripe_api'
        })
      } catch (stripeError: any) {
        console.error(`[STRIPE ENHANCED] Failed to create PaymentIntent:`, stripeError.message)
        console.error(`[STRIPE ENHANCED] Error details:`, stripeError)
        throw stripeError
      }
    }
    
    // For other providers, use default flow
    const session = await paymentService.createPaymentSession(
      paymentCollectionId,
      {
        provider_id: provider_id,
        currency_code: cart.currency_code,
        amount: amountInCents,
        context: {
          cart_id: cartId
        }
      } as any
    )
    
    return res.json({
      payment_session: session,
      payment_collection_id: paymentCollectionId
    })
    
  } catch (error: any) {
    console.error(`[STRIPE ENHANCED] Error creating payment session:`, error)
    
    // Provide detailed error information for debugging
    const errorResponse = {
      error: error.message || "Failed to create payment session",
      cart_id: cartId,
      provider_id,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error
      })
    }
    
    return res.status(500).json(errorResponse)
  }
}