import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Complete Cart Endpoint for Medusa v2
 * 
 * This endpoint handles the final step of checkout:
 * 1. Completes the cart
 * 2. Creates an order
 * 3. Returns the order details
 * 
 * Must be called AFTER successful payment authorization
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id } = req.body as { cart_id: string }

  if (!cart_id) {
    return res.status(400).json({
      success: false,
      error: "cart_id is required"
    })
  }

  try {
    console.log(`[Complete Cart] Starting completion for cart: ${cart_id}`)
    
    // Execute the complete cart workflow
    // This will validate payment, create order, and clean up cart
    const { result, errors } = await completeCartWorkflow(req.scope).run({
      input: {
        id: cart_id
      }
    })

    if (errors && errors.length > 0) {
      console.error(`[Complete Cart] Workflow errors:`, errors)
      return res.status(400).json({
        success: false,
        error: "Failed to complete cart",
        details: errors
      })
    }

    console.log(`[Complete Cart] Successfully created order from cart: ${cart_id}`)
    console.log(`[Complete Cart] Result:`, result)

    // Return the created order
    return res.json({
      success: true,
      order: result,
      message: "Order created successfully"
    })

  } catch (error: any) {
    console.error(`[Complete Cart] Error:`, error)
    
    // Common error messages with helpful hints
    if (error.message?.includes("payment")) {
      return res.status(400).json({
        success: false,
        error: "Payment not authorized",
        hint: "Ensure payment session is authorized before completing cart"
      })
    }
    
    if (error.message?.includes("cart")) {
      return res.status(404).json({
        success: false,
        error: "Cart not found or already completed",
        hint: "Cart may have already been converted to an order"
      })
    }

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to complete cart",
      details: process.env.NODE_ENV === "development" ? error : undefined
    })
  }
}

/**
 * GET endpoint to check if cart can be completed
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const cart_id = req.query.cart_id as string

  if (!cart_id) {
    return res.status(400).json({
      success: false,
      error: "cart_id is required as query parameter"
    })
  }

  try {
    // For GET endpoint, just return a simple status
    // The actual cart checking would need proper service resolution
    
    return res.json({
      success: true,
      message: "Use POST to complete cart",
      cart_id: cart_id,
      hint: "Send POST request with cart_id in body to complete the cart"
    })
    
    /* Original complex cart checking - commented out due to service resolution issues
    const cartService = req.scope.resolve("cartService")
    const paymentService = req.scope.resolve("paymentService")
    
    const cart = await cartService.retrieve(cart_id, {
      relations: ["payment_collection", "payment_sessions"]
    })

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: "Cart not found"
      })
    }

    const paymentSessions = cart.payment_sessions || []
    const authorizedSession = paymentSessions.find((s: any) => s.status === "authorized")

    return res.json({
      success: true,
      cart_id: cart.id,
      has_payment_collection: !!cart.payment_collection,
      has_payment_sessions: paymentSessions.length > 0,
      has_authorized_payment: !!authorizedSession,
      can_complete: !!authorizedSession,
      hint: !authorizedSession ? "Payment must be authorized before completing cart" : "Cart is ready to complete"
    })
    */
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to check cart status"
    })
  }
}