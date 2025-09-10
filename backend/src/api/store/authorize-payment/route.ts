import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IPaymentModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Authorize Payment Session Endpoint
 * 
 * This endpoint authorizes a payment session after Stripe confirms payment
 * Must be called BEFORE completing the cart
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { 
    payment_collection_id, 
    payment_session_id,
    payment_intent_id,  // NEW: from frontend Stripe integration
    session_id,         // NEW: from frontend checkout session  
    cart_id 
  } = req.body as any

  // Support both old and new data formats
  let actualPaymentSessionId = payment_session_id || payment_intent_id
  
  if (!actualPaymentSessionId) {
    return res.status(400).json({
      success: false,
      error: "payment_session_id or payment_intent_id is required"
    })
  }

  // We need to find the payment collection and session
  let actualPaymentCollectionId = payment_collection_id
  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
  
  try {
    
    // If we have cart_id, find the payment collection and session
    if (cart_id) {
      const query = req.scope.resolve("query")
      const { data: [cart] } = await query.graph({
        entity: "cart",
        filters: { id: cart_id },
        fields: [
          "payment_collection.*",
          "payment_collection.payment_sessions.*"
        ],
      })
      
      if (cart?.payment_collection?.id) {
        actualPaymentCollectionId = cart.payment_collection.id
        console.log(`[Authorize Payment] Found payment collection: ${actualPaymentCollectionId} for cart: ${cart_id}`)
        
        // Find the matching payment session
        const sessions = cart.payment_collection.payment_sessions || []
        const matchingSession = sessions.find((s: any) => 
          s.id === actualPaymentSessionId || 
          s.data?.id === actualPaymentSessionId
        )
        
        if (matchingSession) {
          actualPaymentSessionId = matchingSession.id
          console.log(`[Authorize Payment] Found matching session: ${actualPaymentSessionId}`)
        }
      } else {
        return res.status(400).json({
          success: false,
          error: "No payment collection found for this cart"
        })
      }
    }
  } catch (error) {
    console.error(`[Authorize Payment] Error finding payment collection:`, error)
    return res.status(400).json({
      success: false,
      error: "Could not find payment collection for cart"
    })
  }

  try {
    console.log(`[Authorize Payment] Starting authorization for session: ${actualPaymentSessionId}`)
    
    // Authorize the payment session
    const authorizedSession = await paymentService.authorizePaymentSession(
      actualPaymentSessionId,
      {}
    )

    console.log(`[Authorize Payment] Session authorized successfully`)

    return res.json({
      success: true,
      payment_session: authorizedSession,
      message: "Payment authorized successfully",
      next_step: "Call POST /store/complete-cart to create order"
    })

  } catch (error: any) {
    console.error(`[Authorize Payment] Error:`, error)
    
    if (error.message?.includes("already")) {
      return res.json({
        success: true,
        message: "Payment already authorized",
        next_step: "Call POST /store/complete-cart to create order"
      })
    }

    return res.status(400).json({
      success: false,
      error: error.message || "Failed to authorize payment"
    })
  }
}

/**
 * GET endpoint to check payment authorization status
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const payment_session_id = req.query.payment_session_id as string
  const cart_id = req.query.cart_id as string

  if (!payment_session_id && !cart_id) {
    return res.status(400).json({
      success: false,
      error: "Either payment_session_id or cart_id is required"
    })
  }

  try {
    const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    
    let paymentSession
    
    if (payment_session_id) {
      // Direct lookup by session ID
      paymentSession = await paymentService.retrievePaymentSession(payment_session_id)
    } else if (cart_id) {
      // Find by cart ID
      const collections = await paymentService.listPaymentCollections({
        cart: { id: [cart_id] }
      } as any)
      
      if (collections && collections.length > 0) {
        const sessions = await paymentService.listPaymentSessions({
          payment_collection_id: collections[0].id
        })
        
        paymentSession = sessions?.[0]
      }
    }

    if (!paymentSession) {
      return res.status(404).json({
        success: false,
        error: "Payment session not found"
      })
    }

    const isAuthorized = paymentSession.status === "authorized" || 
                        paymentSession.authorized_at !== null

    return res.json({
      success: true,
      payment_session_id: paymentSession.id,
      status: paymentSession.status,
      is_authorized: isAuthorized,
      authorized_at: paymentSession.authorized_at,
      provider_id: paymentSession.provider_id,
      hint: isAuthorized 
        ? "Payment is authorized, ready to complete cart" 
        : "Payment needs to be authorized before completing cart"
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to check payment status"
    })
  }
}