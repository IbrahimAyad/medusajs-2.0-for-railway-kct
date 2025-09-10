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
    
    // Amount is already in cents from Medusa
    const amountInCents = cart.total
    console.log(`[STRIPE FIX] Cart total: ${amountInCents} cents ($${amountInCents/100})`)
    
    // Create or get payment collection
    let paymentCollectionId = cart.payment_collection?.id
    if (!paymentCollectionId) {
      const collection = await paymentService.createPaymentCollections({
        cart_id: cartId,
        region_id: cart.region_id,
        currency_code: cart.currency_code,
        amount: amountInCents // Already in cents!
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
      if (!stripeKey) {
        throw new Error("Stripe API key not configured")
      }
      
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2025-08-27.basil'
      })
      
      // Create payment intent with CORRECT amount (no multiplication!)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, // Already in cents, NO MULTIPLICATION!
        currency: cart.currency_code,
        capture_method: 'manual', // CRITICAL: Use manual capture so backend can control it
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