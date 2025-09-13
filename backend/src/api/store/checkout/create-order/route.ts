import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, ICustomerModuleService, IRegionModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * Create Order Endpoint - Order-First Checkout Flow
 * Endpoint: /store/checkout/create-order
 * 
 * This creates a "pending" order first, then creates a Stripe payment intent
 * with the order_id in metadata. This ensures orders always appear in Medusa admin.
 */

interface CreateOrderRequest {
  cart_id?: string
  email: string
  shipping_address: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    postal_code: string
    province: string
    country_code: string
    phone?: string
  }
  billing_address?: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    postal_code: string
    province: string
    country_code: string
    phone?: string
  }
  items: Array<{
    title: string
    variant_id?: string
    product_id?: string
    quantity: number
    unit_price: number
    metadata?: any
  }>
  amount: number // in cents
  currency_code?: string
  customer_name?: string
  metadata?: any
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY

  if (!stripeKey) {
    console.error("[Create Order] Missing Stripe API key")
    return res.status(500).json({ error: "Payment configuration missing" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2025-08-27.basil',
  })

  try {
    const {
      cart_id,
      email,
      shipping_address,
      billing_address,
      items,
      amount,
      currency_code = 'usd',
      customer_name,
      metadata = {}
    } = req.body as CreateOrderRequest

    console.log("[Create Order] Creating order-first checkout:", {
      email,
      amount,
      itemCount: items?.length,
      cart_id
    })

    // Validate required fields
    if (!email || !shipping_address || !items || !amount) {
      return res.status(400).json({ 
        error: "Missing required fields: email, shipping_address, items, amount" 
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: "Items array is required and cannot be empty" 
      })
    }

    // Resolve services
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    const customerService = req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)
    const regionService = req.scope.resolve<IRegionModuleService>(Modules.REGION)

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
        console.log(`[Create Order] Found existing customer: ${customer.id}`)
      } else {
        // Create guest customer
        const nameParts = customer_name?.split(' ') || shipping_address?.first_name ? [shipping_address.first_name, shipping_address.last_name] : ['Guest', 'Customer']
        const customerData = {
          email,
          first_name: nameParts[0] || shipping_address?.first_name || 'Guest',
          last_name: nameParts.slice(1).join(' ') || shipping_address?.last_name || 'Customer',
          has_account: false,
          metadata: {
            source: 'order_first_checkout',
            created_via: 'create_order_endpoint'
          }
        }
        
        customer = await customerService.createCustomers(customerData)
        console.log(`[Create Order] Created guest customer: ${customer.id}`)
      }
    }

    // Step 2: Get default region
    const regionId = "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"

    // Step 3: Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    const tax_total = 0 // You may want to calculate tax here
    const shipping_total = 0 // You may want to calculate shipping here
    const discount_total = 0
    const total = subtotal + tax_total + shipping_total - discount_total

    // Validate amount matches calculated total
    if (Math.abs(total - amount) > 1) { // Allow 1 cent difference for rounding
      console.warn(`[Create Order] Amount mismatch: calculated ${total}, provided ${amount}`)
    }

    // Step 4: Create the order with "pending" status
    const orderData = {
      email: email,
      currency_code: currency_code,
      customer_id: customer?.id,
      region_id: regionId,
      
      // Use billing address if provided, otherwise use shipping address
      billing_address: billing_address || shipping_address,
      shipping_address: shipping_address,

      // Order items
      items: items.map(item => ({
        title: item.title,
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.unit_price * item.quantity,
        metadata: {
          ...item.metadata,
          source: 'order_first_checkout'
        }
      })),

      // Totals
      total: amount, // Use provided amount
      subtotal: subtotal,
      tax_total: tax_total,
      shipping_total: shipping_total,
      discount_total: discount_total,

      // Metadata to track payment status
      // Note: Medusa v2 doesn't have direct payment_status field on OrderDTO

      // Store important metadata
      metadata: {
        ...metadata,
        cart_id: cart_id || 'direct_order',
        created_from: 'order_first_checkout',
        source: 'create_order_endpoint',
        checkout_type: 'order_first',
        original_amount: amount
      }
    }

    console.log("[Create Order] Creating order with data:", {
      email: orderData.email,
      customer_id: orderData.customer_id,
      region_id: orderData.region_id,
      total: orderData.total,
      itemCount: orderData.items.length,
      metadata: orderData.metadata
    })

    // Create the order
    const orders = await orderService.createOrders(orderData as any)
    const order = Array.isArray(orders) ? orders[0] : orders
    
    if (!order) {
      throw new Error("Failed to create order")
    }

    console.log(`[Create Order] ✅ Order created successfully: ${order.id}`)

    // Step 5: Create Stripe payment intent with order_id in metadata
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: amount,
      currency: currency_code,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order.id, // This is the key change - use order_id instead of cart_id
        email: email,
        customer_name: customer_name || `${shipping_address.first_name} ${shipping_address.last_name}`,
        source: 'order_first_checkout',
        ...(cart_id && { cart_id }) // Keep cart_id if provided for backwards compatibility
      },
      description: `Order ${order.id} - ${items.length} item(s)`,
      receipt_email: email,
      shipping: {
        name: `${shipping_address.first_name} ${shipping_address.last_name}`,
        address: {
          line1: shipping_address.address_1,
          line2: shipping_address.address_2 || undefined,
          city: shipping_address.city,
          state: shipping_address.province,
          postal_code: shipping_address.postal_code,
          country: shipping_address.country_code.toUpperCase(),
        },
      },
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    console.log(`[Create Order] ✅ Payment intent created: ${paymentIntent.id}`)

    // Step 6: Update order with payment intent information
    await orderService.updateOrders({
      id: order.id,
      metadata: {
        ...order.metadata,
        payment_intent_id: paymentIntent.id,
        stripe_client_secret: paymentIntent.client_secret
      }
    } as any)

    // Return response with order_id and client_secret
    return res.json({
      success: true,
      order_id: order.id,
      client_secret: paymentIntent.client_secret,
      amount: amount,
      currency: currency_code,
      payment_intent_id: paymentIntent.id,
      order: {
        id: order.id,
        status: order.status,
        payment_captured: order.metadata?.payment_captured || false,
        total: order.total,
        currency_code: order.currency_code,
        email: order.email
      }
    })

  } catch (error: any) {
    console.error("[Create Order] Error:", error)
    return res.status(500).json({ 
      error: "Failed to create order",
      details: error.message,
      success: false
    })
  }
}