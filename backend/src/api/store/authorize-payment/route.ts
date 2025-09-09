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
    cart_id 
  } = req.body as any

  if (!payment_collection_id || !payment_session_id) {
    return res.status(400).json({
      success: false,
      error: "payment_collection_id and payment_session_id are required"
    })
  }

  try {
    console.log(`[Authorize Payment] Starting authorization for session: ${payment_session_id}`)
    
    const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    
    // Authorize the payment session
    const authorizedSession = await paymentService.authorizePaymentSession(
      payment_session_id,
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