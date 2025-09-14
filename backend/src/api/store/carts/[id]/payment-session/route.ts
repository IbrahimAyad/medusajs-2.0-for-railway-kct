import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * CRITICAL FIX FOR STRIPE 100X BUG
 * 
 * This endpoint creates payment sessions with the CORRECT amount.
 * Medusa stores amounts in cents, and we pass them directly to Stripe
 * WITHOUT multiplying by 100 again.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id: cartId } = req.params
  const { provider_id = "stripe" } = req.body as any
  
  console.log(`[STRIPE FIX] Creating payment session for cart ${cartId}`)
  
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    
    // Get cart with payment collection
    const { data: [cart] } = await query.graph({
      entity: "cart",
      filters: { id: cartId },
      fields: [
        "id",
        "total",
        "currency_code",
        "payment_collection.*",
        "payment_collection.payment_sessions.*"
      ],
    })
    
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" })
    }
    
    // Convert BigNumber to integer - Medusa v2 stores amounts as BigNumber objects
    const amountInCents = Math.round(Number(cart.total))
    console.log(`[STRIPE FIX] Cart total: ${amountInCents} cents ($${amountInCents/100})`)
    
    // Validate cart has items and valid total
    if (amountInCents <= 0) {
      console.error(`[STRIPE FIX] Cart has invalid total: ${cart.total}`)
      return res.status(400).json({ 
        error: "Cart is empty or has invalid total. Please add items to your cart.",
        cart_total: String(cart.total),
        cart_id: cartId
      })
    }
    
    // Stripe requires minimum amount of 50 cents
    if (amountInCents < 50) {
      console.error(`[STRIPE FIX] Cart total below Stripe minimum: ${amountInCents} cents`)
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
      console.log(`[STRIPE FIX] Created payment collection ${paymentCollectionId}`)
    }
    
    // For fresh checkout experience, always create new payment intent
    // Skip checking for existing sessions to avoid stale payment data
    console.log(`[STRIPE FIX] Creating fresh payment session`)
    
    // For Stripe, create the payment intent directly with correct amount
    if (provider_id === "stripe") {
      const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY
      console.log(`[STRIPE FIX] Stripe key exists: ${!!stripeKey}`)
      
      if (!stripeKey) {
        console.error(`[STRIPE FIX] ERROR: Stripe API key not configured`)
        throw new Error("Stripe API key not configured")
      }
      
      try {
        const stripe = new Stripe(stripeKey, {
          apiVersion: '2025-08-27.basil'
        })
        
        console.log(`[STRIPE FIX] Creating PaymentIntent with amount: ${amountInCents}`)
        
        // Create payment intent with CORRECT amount (no multiplication!)
        const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, // Already in cents, NO MULTIPLICATION!
        currency: cart.currency_code,
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
      
        console.log(`[STRIPE FIX] Created Stripe PaymentIntent ${paymentIntent.id} for ${amountInCents} cents`)
        
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
          context: {
            cart_id: cartId
          }
        } as any
      )
      
      console.log(`[STRIPE FIX] Created payment session ${session.id}`)
      
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
          stripe_amount_usd: amountInCents / 100
        })
      } catch (stripeError: any) {
        console.error(`[STRIPE FIX] Failed to create PaymentIntent:`, stripeError.message)
        console.error(`[STRIPE FIX] Error details:`, stripeError)
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
    console.error(`[STRIPE FIX] Error creating payment session:`, error)
    return res.status(500).json({
      error: error.message || "Failed to create payment session"
    })
  }
}