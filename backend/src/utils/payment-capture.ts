import { MedusaRequest } from "@medusajs/framework/http"
import { 
  IOrderModuleService, 
  IPaymentModuleService,
  OrderDTO
} from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * Payment capture utility for Medusa v2
 * Handles payment status tracking through order metadata since v2 doesn't have direct payment_status field
 */

export type PaymentStatus = 'pending' | 'captured' | 'failed' | 'canceled' | 'requires_action'

export interface PaymentCaptureMetadata {
  payment_captured?: boolean
  payment_status?: PaymentStatus
  payment_intent_id?: string
  payment_captured_at?: string
  payment_failed_at?: string
  payment_canceled_at?: string
  stripe_payment_status?: string
  stripe_payment_method?: string
  stripe_amount_received?: number
  stripe_currency?: string
  webhook_processed?: boolean
  webhook_source?: string
  last_webhook_event?: string
  last_webhook_processed_at?: string
  last_payment_error?: string
  cancellation_reason?: string
  ready_for_fulfillment?: boolean
}

export interface PaymentCaptureResult {
  success: boolean
  order_id: string
  payment_status: PaymentStatus
  message?: string
  error?: string
}

/**
 * Update order metadata when payment is captured
 */
export async function captureOrderPayment(
  req: MedusaRequest,
  orderId: string,
  paymentIntent: Stripe.PaymentIntent,
  eventType?: string
): Promise<PaymentCaptureResult> {
  try {
    console.log(`[Payment Capture] Processing payment capture for order: ${orderId}`)
    
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    
    // Get the current order
    const orders = await orderService.listOrders({ id: orderId })
    const order = orders?.[0]
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }
    
    // Check if payment is already captured
    const currentMetadata = order.metadata as PaymentCaptureMetadata || {}
    if (currentMetadata.payment_captured === true) {
      console.log(`[Payment Capture] Order ${orderId} already has captured payment`)
      return {
        success: true,
        order_id: orderId,
        payment_status: 'captured',
        message: 'Payment already captured'
      }
    }
    
    // Verify payment amount matches order total (with tolerance for rounding)
    const orderAmountInCents = Math.round(Number(order.total) * 100)
    const amountDifference = Math.abs(paymentIntent.amount - orderAmountInCents)
    
    if (amountDifference > 1) {
      console.warn(`[Payment Capture] Amount mismatch for order ${orderId}:`, {
        payment_amount: paymentIntent.amount,
        order_amount: orderAmountInCents,
        difference: amountDifference
      })
    }
    
    // Prepare capture metadata
    const captureMetadata: PaymentCaptureMetadata = {
      ...currentMetadata,
      payment_captured: true,
      payment_status: 'captured',
      payment_intent_id: paymentIntent.id,
      payment_captured_at: new Date().toISOString(),
      stripe_payment_status: paymentIntent.status,
      stripe_payment_method: paymentIntent.payment_method_types?.[0] || 'unknown',
      stripe_amount_received: paymentIntent.amount_received || paymentIntent.amount,
      stripe_currency: paymentIntent.currency,
      webhook_processed: true,
      webhook_source: eventType || 'payment_intent_succeeded',
      last_webhook_event: eventType || 'payment_intent.succeeded',
      last_webhook_processed_at: new Date().toISOString(),
      ready_for_fulfillment: true
    }
    
    // Update order with capture metadata
    await orderService.updateOrders({
      id: orderId,
      metadata: captureMetadata
    } as any)
    
    console.log(`[Payment Capture] ✅ Order ${orderId} payment captured successfully`)
    
    // Update associated payment collections if they exist
    await updatePaymentCollections(req, orderId, paymentIntent)
    
    return {
      success: true,
      order_id: orderId,
      payment_status: 'captured',
      message: 'Payment captured and order ready for fulfillment'
    }
    
  } catch (error: any) {
    console.error(`[Payment Capture] Error capturing payment for order ${orderId}:`, error)
    return {
      success: false,
      order_id: orderId,
      payment_status: 'pending',
      error: error.message
    }
  }
}

/**
 * Update order metadata when payment fails
 */
export async function failOrderPayment(
  req: MedusaRequest,
  orderId: string,
  paymentIntent: Stripe.PaymentIntent,
  eventType?: string
): Promise<PaymentCaptureResult> {
  try {
    console.log(`[Payment Capture] Processing payment failure for order: ${orderId}`)
    
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    
    // Get the current order
    const orders = await orderService.listOrders({ id: orderId })
    const order = orders?.[0]
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }
    
    const currentMetadata = order.metadata as PaymentCaptureMetadata || {}
    
    // Prepare failure metadata
    const failureMetadata: PaymentCaptureMetadata = {
      ...currentMetadata,
      payment_captured: false,
      payment_status: 'failed',
      payment_intent_id: paymentIntent.id,
      payment_failed_at: new Date().toISOString(),
      stripe_payment_status: 'failed',
      webhook_processed: true,
      webhook_source: eventType || 'payment_intent_payment_failed',
      last_webhook_event: eventType || 'payment_intent.payment_failed',
      last_webhook_processed_at: new Date().toISOString(),
      last_payment_error: paymentIntent.last_payment_error?.message || 'Payment failed',
      ready_for_fulfillment: false
    }
    
    // Update order with failure metadata
    await orderService.updateOrders({
      id: orderId,
      metadata: failureMetadata
    } as any)
    
    console.log(`[Payment Capture] ✅ Order ${orderId} marked as payment failed`)
    
    return {
      success: true,
      order_id: orderId,
      payment_status: 'failed',
      message: 'Payment failure recorded'
    }
    
  } catch (error: any) {
    console.error(`[Payment Capture] Error updating failed payment for order ${orderId}:`, error)
    return {
      success: false,
      order_id: orderId,
      payment_status: 'pending',
      error: error.message
    }
  }
}

/**
 * Update order metadata when payment is canceled
 */
export async function cancelOrderPayment(
  req: MedusaRequest,
  orderId: string,
  paymentIntent: Stripe.PaymentIntent,
  eventType?: string
): Promise<PaymentCaptureResult> {
  try {
    console.log(`[Payment Capture] Processing payment cancellation for order: ${orderId}`)
    
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    
    // Get the current order
    const orders = await orderService.listOrders({ id: orderId })
    const order = orders?.[0]
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }
    
    const currentMetadata = order.metadata as PaymentCaptureMetadata || {}
    
    // Prepare cancellation metadata
    const cancellationMetadata: PaymentCaptureMetadata = {
      ...currentMetadata,
      payment_captured: false,
      payment_status: 'canceled',
      payment_intent_id: paymentIntent.id,
      payment_canceled_at: new Date().toISOString(),
      stripe_payment_status: 'canceled',
      webhook_processed: true,
      webhook_source: eventType || 'payment_intent_canceled',
      last_webhook_event: eventType || 'payment_intent.canceled',
      last_webhook_processed_at: new Date().toISOString(),
      cancellation_reason: paymentIntent.cancellation_reason || 'Payment canceled',
      ready_for_fulfillment: false
    }
    
    // Update order with cancellation metadata
    await orderService.updateOrders({
      id: orderId,
      metadata: cancellationMetadata
    } as any)
    
    console.log(`[Payment Capture] ✅ Order ${orderId} marked as payment canceled`)
    
    return {
      success: true,
      order_id: orderId,
      payment_status: 'canceled',
      message: 'Payment cancellation recorded'
    }
    
  } catch (error: any) {
    console.error(`[Payment Capture] Error updating canceled payment for order ${orderId}:`, error)
    return {
      success: false,
      order_id: orderId,
      payment_status: 'pending',
      error: error.message
    }
  }
}

/**
 * Find order by payment intent ID in metadata
 */
export async function findOrderByPaymentIntentId(
  req: MedusaRequest,
  paymentIntentId: string
): Promise<OrderDTO | null> {
  try {
    console.log(`[Payment Capture] Searching for order with payment_intent_id: ${paymentIntentId}`)
    
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    
    // Search for orders where metadata contains the payment_intent_id
    const orders = await orderService.listOrders({
      metadata: {
        payment_intent_id: paymentIntentId
      }
    } as any)
    
    if (orders && orders.length > 0) {
      console.log(`[Payment Capture] Found ${orders.length} order(s) with payment_intent_id ${paymentIntentId}`)
      return orders[0] // Return the first match
    }
    
    console.log(`[Payment Capture] No orders found with payment_intent_id: ${paymentIntentId}`)
    return null
    
  } catch (error: any) {
    console.error(`[Payment Capture] Error searching for order by payment_intent_id ${paymentIntentId}:`, error)
    return null
  }
}

/**
 * Get payment status from order metadata
 */
export function getOrderPaymentStatus(order: OrderDTO): PaymentStatus {
  const metadata = order.metadata as PaymentCaptureMetadata
  
  if (!metadata) {
    return 'pending'
  }
  
  return metadata.payment_status || 'pending'
}

/**
 * Check if order payment is captured
 */
export function isOrderPaymentCaptured(order: OrderDTO): boolean {
  const metadata = order.metadata as PaymentCaptureMetadata
  
  if (!metadata) {
    return false
  }
  
  return metadata.payment_captured === true && metadata.payment_status === 'captured'
}

/**
 * Check if order is ready for fulfillment based on payment status
 */
export function isOrderReadyForFulfillment(order: OrderDTO): boolean {
  const metadata = order.metadata as PaymentCaptureMetadata
  
  if (!metadata) {
    return false
  }
  
  return metadata.ready_for_fulfillment === true && metadata.payment_captured === true
}

/**
 * Create or update payment collection record for tracking
 */
export async function updatePaymentCollections(
  req: MedusaRequest,
  orderId: string,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  try {
    const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Find payment collections for this order
    const { data: paymentCollections } = await query.graph({
      entity: "payment_collection",
      filters: {
        metadata: {
          order_id: orderId
        }
      },
      fields: ["id", "status", "amount", "metadata"]
    })
    
    if (paymentCollections && paymentCollections.length > 0) {
      for (const collection of paymentCollections) {
        console.log(`[Payment Capture] Updating payment collection ${collection.id} for order ${orderId}`)
        
        await paymentService.updatePaymentCollections(collection.id, {
          metadata: {
            ...collection.metadata,
            payment_captured: true,
            payment_intent_id: paymentIntent.id,
            webhook_processed: true,
            payment_captured_at: new Date().toISOString()
          }
        } as any)
      }
    } else {
      console.log(`[Payment Capture] No payment collections found for order ${orderId}`)
    }
    
  } catch (error: any) {
    console.warn(`[Payment Capture] Could not update payment collections for order ${orderId}:`, error)
    // Don't throw - payment collection updates are not critical
  }
}

/**
 * Simplified payment capture utility that doesn't require request object
 * Used by webhook handlers and confirmation endpoints
 */
export async function capturePaymentUtil(
  orderService: IOrderModuleService,
  orderId: string,
  paymentIntentId: string,
  stripeStatus: string,
  additionalMetadata?: any
): Promise<PaymentCaptureResult> {
  try {
    console.log(`[Payment Util] Capturing payment for order: ${orderId}`)
    
    // Get the current order
    const orders = await orderService.listOrders({ id: orderId })
    const order = orders?.[0]
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }
    
    const currentMetadata = order.metadata as PaymentCaptureMetadata || {}
    
    // Check if already captured
    if (currentMetadata.payment_captured === true) {
      console.log(`[Payment Util] Payment already captured for order: ${orderId}`)
      return {
        success: true,
        order_id: orderId,
        payment_status: 'captured',
        message: 'Payment already captured'
      }
    }
    
    // Prepare capture metadata
    const captureMetadata: PaymentCaptureMetadata = {
      ...currentMetadata,
      payment_captured: true,
      payment_status: 'captured',
      payment_intent_id: paymentIntentId,
      payment_captured_at: new Date().toISOString(),
      stripe_payment_status: stripeStatus,
      webhook_processed: true,
      ready_for_fulfillment: true,
      ...additionalMetadata
    }
    
    // Update order with capture metadata
    await orderService.updateOrders({
      id: orderId,
      metadata: captureMetadata
    } as any)
    
    console.log(`[Payment Util] ✅ Order ${orderId} payment captured successfully`)
    
    return {
      success: true,
      order_id: orderId,
      payment_status: 'captured',
      message: 'Payment captured and order ready for fulfillment'
    }
    
  } catch (error: any) {
    console.error(`[Payment Util] Error capturing payment for order ${orderId}:`, error)
    return {
      success: false,
      order_id: orderId,
      payment_status: 'pending',
      error: error.message
    }
  }
}

/**
 * Create comprehensive payment metadata for new orders
 */
export function createInitialPaymentMetadata(
  paymentIntentId: string,
  cartId?: string
): Partial<PaymentCaptureMetadata> {
  return {
    payment_captured: false,
    payment_status: 'pending',
    payment_intent_id: paymentIntentId,
    webhook_processed: false,
    ready_for_fulfillment: false,
    ...(cartId && { cart_id: cartId })
  }
}

/**
 * Batch update multiple orders with payment status
 */
export async function batchUpdateOrderPaymentStatus(
  req: MedusaRequest,
  orderIds: string[],
  status: PaymentStatus,
  metadata?: Partial<PaymentCaptureMetadata>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = { success: 0, failed: 0, errors: [] as string[] }
  
  const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
  
  for (const orderId of orderIds) {
    try {
      const orders = await orderService.listOrders({ id: orderId })
      const order = orders?.[0]
      
      if (!order) {
        results.failed++
        results.errors.push(`Order ${orderId} not found`)
        continue
      }
      
      const currentMetadata = (order.metadata as PaymentCaptureMetadata) || {}
      const updatedMetadata: PaymentCaptureMetadata = {
        ...currentMetadata,
        ...metadata,
        payment_status: status,
        last_webhook_processed_at: new Date().toISOString()
      }
      
      await orderService.updateOrders({
        id: orderId,
        metadata: updatedMetadata
      } as any)
      
      results.success++
      
    } catch (error: any) {
      results.failed++
      results.errors.push(`Order ${orderId}: ${error.message}`)
    }
  }
  
  return results
}