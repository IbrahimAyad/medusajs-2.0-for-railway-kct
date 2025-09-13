import { MedusaRequest } from "@medusajs/framework/http"
import { IOrderModuleService, ICustomerModuleService, IProductModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * Fallback order creation when cart doesn't exist
 * Creates order directly from Stripe payment intent data
 */
export async function createOrderFromPaymentIntent(
  req: MedusaRequest,
  paymentIntent: Stripe.PaymentIntent
) {
  const email = paymentIntent.metadata?.email || paymentIntent.receipt_email
  const cartId = paymentIntent.metadata?.cartId
  const customerName = paymentIntent.metadata?.customer_name
  
  console.log("[Fallback Order] Creating order from payment intent:", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    email,
    cartId
  })

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    const customerService = req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
    const productService = req.scope.resolve<IProductModuleService>(Modules.PRODUCT)

    // Step 1: Find or create customer
    let customer = null
    if (email) {
      const { data: customers } = await query.graph({
        entity: "customer",
        filters: { email },
        fields: ["id", "email", "first_name", "last_name", "has_account"]
      })

      if (customers && customers.length > 0) {
        customer = customers[0]
        console.log(`[Fallback Order] Found existing customer: ${customer.id}`)
      } else {
        // Create guest customer
        const nameParts = customerName?.split(' ') || []
        const customerData = {
          email,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          has_account: false,
          metadata: {
            source: 'stripe_webhook_fallback',
            payment_intent_id: paymentIntent.id
          }
        }
        
        customer = await customerService.createCustomers(customerData)
        console.log(`[Fallback Order] Created guest customer: ${customer.id}`)
      }
    }

    // Step 2: Create a basic order structure
    // Note: This is simplified - in production you'd want to extract more data
    const orderData = {
      email: email || 'noemail@example.com',
      currency_code: paymentIntent.currency || 'usd',
      customer_id: customer?.id,
      
      // Extract shipping address from payment intent if available
      shipping_address: paymentIntent.shipping ? {
        first_name: paymentIntent.shipping.name?.split(' ')[0] || '',
        last_name: paymentIntent.shipping.name?.split(' ').slice(1).join(' ') || '',
        address_1: paymentIntent.shipping.address?.line1 || '',
        address_2: paymentIntent.shipping.address?.line2 || '',
        city: paymentIntent.shipping.address?.city || '',
        postal_code: paymentIntent.shipping.address?.postal_code || '',
        province: paymentIntent.shipping.address?.state || '',
        country_code: paymentIntent.shipping.address?.country?.toLowerCase() || 'us',
      } : {
        first_name: customerName?.split(' ')[0] || 'Guest',
        last_name: customerName?.split(' ').slice(1).join(' ') || 'Customer',
        address_1: 'Address pending',
        city: 'City pending',
        postal_code: '00000',
        country_code: 'us'
      },

      // Store important metadata
      metadata: {
        cart_id: cartId || 'no-cart',
        payment_intent_id: paymentIntent.id,
        stripe_amount: paymentIntent.amount,
        created_from: 'webhook_fallback',
        source: 'stripe_webhook',
        fallback_reason: 'cart_not_found'
      },

      // Payment status
      payment_status: 'captured',
      
      // Items would need to be reconstructed from metadata or defaults
      items: [
        {
          title: paymentIntent.description || 'Product (details pending)',
          quantity: 1,
          unit_price: paymentIntent.amount,
          metadata: {
            payment_intent_id: paymentIntent.id
          }
        }
      ],

      // Total amounts
      total: paymentIntent.amount,
      subtotal: paymentIntent.amount,
      tax_total: 0,
      shipping_total: 0,
      discount_total: 0
    }

    console.log("[Fallback Order] Creating order with data:", orderData)

    // Step 3: Create the order
    // Note: The exact method depends on your Medusa version and setup
    const order = await orderService.createOrders(orderData as any)
    
    console.log(`[Fallback Order] ✅ Order created successfully: ${order.id}`)
    
    return {
      success: true,
      order,
      customer,
      message: "Order created from payment intent fallback"
    }

  } catch (error: any) {
    console.error("[Fallback Order] Error creating order:", error)
    return {
      success: false,
      error: error.message,
      message: "Failed to create order from payment intent"
    }
  }
}

/**
 * Check if we should use fallback order creation
 */
export function shouldUseFallback(cart: any): boolean {
  // Use fallback if:
  // 1. Cart doesn't exist
  // 2. Cart is already completed
  // 3. Cart has no items
  // 4. Cart has no payment collection
  
  if (!cart) return true
  if (cart.completed_at) return true
  if (!cart.items || cart.items.length === 0) return true
  if (!cart.payment_collection) return true
  
  return false
}