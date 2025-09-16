import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, ICustomerModuleService, IRegionModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { calculateTax, getTaxSummary } from "../../utils/tax-calculator"
import { createInitialPaymentMetadata } from "../../utils/payment-capture"

// Initialize Stripe with the secret key from environment
const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2025-08-27.basil",
})

interface CreatePaymentRequest {
  cart_id?: string
  email?: string
  customer_email?: string  // Support both field names
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

// This endpoint creates orders FIRST, then payments - fixing the "Not paid" issue
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("🚀🚀🚀 STRIPE BYPASS WITH ORDER CREATION - Order-First Checkout")
  
  try {
    // Set CORS headers immediately
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
    
    const {
      cart_id,
      email: bodyEmail,
      customer_email,
      shipping_address,
      billing_address,
      items,
      amount,
      currency_code = 'usd',
      customer_name,
      metadata = {}
    } = req.body as CreatePaymentRequest
    
    // Support both field names for backward compatibility
    const email = bodyEmail || customer_email

    console.log("[Bypass Order-First] Creating order-first checkout:", {
      email,
      amount,
      itemCount: items?.length,
      cart_id
    })

    // Validate required fields for order creation
    if (!email || !shipping_address || !items || !amount) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: email, shipping_address, items, amount" 
      })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false,
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
        console.log(`[Bypass Order-First] Found existing customer: ${customer.id}`)
      } else {
        // Create guest customer
        const nameParts = customer_name?.split(' ') || shipping_address?.first_name ? [shipping_address.first_name, shipping_address.last_name] : ['Guest', 'Customer']
        const customerData = {
          email,
          first_name: nameParts[0] || shipping_address?.first_name || 'Guest',
          last_name: nameParts.slice(1).join(' ') || shipping_address?.last_name || 'Customer',
          has_account: false,
          metadata: {
            source: 'bypass_order_first_checkout',
            created_via: 'stripe_bypass_endpoint'
          }
        }
        
        customer = await customerService.createCustomers(customerData)
        console.log(`[Bypass Order-First] Created guest customer: ${customer.id}`)
      }
    }

    // Step 2: Get default region
    const regionId = "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"

    // Step 3: Calculate totals with tax
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    
    // Calculate tax based on shipping address
    const taxBreakdown = calculateTax({
      subtotal,
      shipping_address: {
        country_code: shipping_address.country_code,
        province: shipping_address.province,
        city: shipping_address.city,
        postal_code: shipping_address.postal_code
      },
      currency_code
    })
    
    const tax_total = taxBreakdown.tax_total
    const shipping_total = 0 // You may want to calculate shipping here
    const discount_total = 0
    const calculated_total = subtotal + tax_total + shipping_total - discount_total
    
    // Use calculated total with tax, not the provided amount
    const final_total = calculated_total
    
    console.log(`[Bypass Order-First] Tax calculation:`, {
      subtotal,
      tax_rate: (taxBreakdown.tax_rate * 100).toFixed(2) + '%',
      tax_name: taxBreakdown.tax_name,
      tax_total,
      calculated_total,
      provided_amount: amount,
      using_calculated_total: final_total
    })

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
          source: 'bypass_order_first_checkout'
        }
      })),

      // Totals
      total: final_total, // Use calculated total with tax
      subtotal: subtotal,
      tax_total: tax_total,
      shipping_total: shipping_total,
      discount_total: discount_total,

      // Store important metadata including payment status
      metadata: {
        ...metadata,
        cart_id: cart_id || 'direct_bypass_order',
        created_from: 'bypass_order_first_checkout',
        source: 'stripe_bypass_endpoint',
        checkout_type: 'bypass_order_first',
        original_amount: amount,
        // Add payment status tracking
        payment_captured: false,
        payment_status: 'pending',
        webhook_processed: false,
        ready_for_fulfillment: false,
        bypass_reason: "medusa_payment_system_failed",
        tax_calculation: {
          tax_rate: taxBreakdown.tax_rate,
          tax_name: taxBreakdown.tax_name,
          tax_jurisdiction: taxBreakdown.tax_details[0]?.jurisdiction || 'Unknown',
          tax_summary: getTaxSummary(taxBreakdown, currency_code)
        }
      }
    }

    console.log("[Bypass Order-First] Creating order with data:", {
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

    console.log(`[Bypass Order-First] ✅ Order created successfully: ${order.id}`)

    // Step 5: Create Stripe payment intent with order_id in metadata
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: final_total, // Use calculated total with tax
      currency: currency_code,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order.id, // This is the key change - use order_id instead of cart_id
        email: email,
        customer_name: customer_name || `${shipping_address.first_name} ${shipping_address.last_name}`,
        source: 'bypass_order_first_checkout',
        subtotal: subtotal.toString(),
        tax_total: tax_total.toString(),
        tax_rate: (taxBreakdown.tax_rate * 100).toFixed(2) + '%',
        tax_name: taxBreakdown.tax_name,
        bypass_reason: "medusa_payment_system_failed",
        created_at: new Date().toISOString(),
        ...(cart_id && { cart_id }) // Keep cart_id if provided for backwards compatibility
      },
      description: `Order ${order.id} - ${items.length} item(s) (BYPASS)`,
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

    console.log(`[Bypass Order-First] ✅ Payment intent created: ${paymentIntent.id}`)

    // Step 6: Update order with payment intent information
    const paymentMetadata = createInitialPaymentMetadata(paymentIntent.id, cart_id)
    await orderService.updateOrders({
      id: order.id,
      metadata: {
        ...order.metadata,
        ...paymentMetadata,
        stripe_client_secret: paymentIntent.client_secret,
        stripe_payment_amount: final_total
      }
    } as any)

    // Return response with order_id and client_secret
    const response = {
      success: true,
      order_id: order.id, // Now we return the order_id!
      client_secret: paymentIntent.client_secret,
      amount: final_total,
      currency: currency_code,
      payment_intent_id: paymentIntent.id,
      cart_id: cart_id,
      message: "BYPASS ORDER-FIRST - Order created first, then payment intent",
      method: "stripe_bypass_order_first",
      timestamp: new Date().toISOString(),
      tax_breakdown: {
        subtotal,
        tax_total,
        tax_rate: taxBreakdown.tax_rate,
        tax_name: taxBreakdown.tax_name,
        total: final_total,
        tax_summary: getTaxSummary(taxBreakdown, currency_code)
      },
      order: {
        id: order.id,
        status: order.status,
        payment_captured: order.metadata?.payment_captured || false,
        total: order.total,
        currency_code: order.currency_code,
        email: order.email
      }
    }

    console.log("🎉 BYPASS ORDER-FIRST SUCCESS:", response)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error("❌ BYPASS ORDER-FIRST ERROR:", error)
    
    // Set CORS headers for errors too
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Order and payment creation failed",
      details: error instanceof Error ? error.stack : undefined,
      method: "stripe_bypass_order_first",
      timestamp: new Date().toISOString()
    })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  return res.status(200).json({ message: 'CORS OK' })
}

// Handle GET requests for testing
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("🔍 BYPASS ORDER-FIRST endpoint health check")
  
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  
  return res.status(200).json({
    message: "STRIPE BYPASS ORDER-FIRST endpoint operational",
    description: "Creates orders FIRST, then payments - fixes 'Not paid' issue",
    timestamp: new Date().toISOString(),
    stripe_configured: !!process.env.STRIPE_API_KEY,
    endpoint: "POST /stripe-bypass",
    method: "order_first_checkout",
    features: [
      "Creates Medusa orders before payment",
      "Includes order_id in Stripe metadata", 
      "Calculates tax automatically",
      "Creates guest customers",
      "Returns order_id + client_secret"
    ],
    status: "ready_for_order_first_bypass"
  })
}