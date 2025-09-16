import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IOrderModuleService, ICustomerModuleService, IRegionModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { calculateTax, getTaxSummary } from "../../../utils/tax-calculator"

/**
 * Stripe Bypass Endpoint - Order-First Flow
 * Endpoint: /store/stripe-bypass
 * 
 * This creates a "pending" order first, then creates a Stripe payment intent
 * with the order_id in metadata. This ensures orders always appear in Medusa admin.
 */

interface StripeBypassRequestBody {
  amount: number
  currency?: string
  metadata?: Record<string, any>
  email?: string
  customer_name?: string
  shipping_address?: {
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
  items?: Array<{
    title: string
    variant_id?: string
    product_id?: string
    quantity: number
    unit_price: number
    metadata?: any
  }>
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const stripeKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY || ""

  if (!stripeKey) {
    console.error("[Stripe Bypass] Missing Stripe API key")
    return res.status(500).json({ error: "Payment configuration missing" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil" as any
  })

  try {
    const {
      amount,
      currency = "usd",
      metadata = {},
      email,
      customer_name,
      shipping_address,
      billing_address,
      items = []
    } = req.body as StripeBypassRequestBody

    console.log("[Stripe Bypass] Creating order-first bypass:", {
      email,
      amount,
      itemCount: items?.length,
      has_shipping_address: !!shipping_address
    })

    // If no items provided, create a default item for the amount
    const finalItems = items.length > 0 ? items : [{
      title: "Bypass Payment",
      quantity: 1,
      unit_price: amount,
      metadata: { bypass_item: true }
    }]

    // Use shipping address if provided, otherwise create a default one
    const finalShippingAddress = shipping_address || {
      first_name: customer_name?.split(' ')[0] || "Guest",
      last_name: customer_name?.split(' ').slice(1).join(' ') || "Customer",
      address_1: "Address not provided",
      city: "Unknown",
      postal_code: "00000",
      province: "MI",
      country_code: "US"
    }

    // Use billing address if provided, otherwise use shipping address
    const finalBillingAddress = billing_address || finalShippingAddress

    // Use email if provided, otherwise generate a guest email
    const finalEmail = email || `guest-${Date.now()}@bypass.local`

    // Resolve services
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER)
    const customerService = req.scope.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    // Step 1: Find or create customer
    let customer = null
    const { data: customers } = await query.graph({
      entity: "customer",
      filters: { email: finalEmail },
      fields: ["id", "email", "first_name", "last_name", "has_account"]
    })

    if (customers && customers.length > 0) {
      customer = customers[0]
      console.log(`[Stripe Bypass] Found existing customer: ${customer.id}`)
    } else {
      // Create guest customer
      const nameParts = customer_name?.split(' ') || [finalShippingAddress.first_name, finalShippingAddress.last_name]
      const customerData = {
        email: finalEmail,
        first_name: nameParts[0] || 'Guest',
        last_name: nameParts.slice(1).join(' ') || 'Customer',
        has_account: false,
        metadata: {
          source: 'stripe_bypass',
          created_via: 'bypass_endpoint'
        }
      }
      
      customer = await customerService.createCustomers(customerData)
      console.log(`[Stripe Bypass] Created guest customer: ${customer.id}`)
    }

    // Step 2: Get default region
    const regionId = "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"

    // Step 3: Calculate totals with tax
    const subtotal = finalItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
    
    // Calculate tax based on shipping address
    const taxBreakdown = calculateTax({
      subtotal,
      shipping_address: {
        country_code: finalShippingAddress.country_code,
        province: finalShippingAddress.province,
        city: finalShippingAddress.city,
        postal_code: finalShippingAddress.postal_code
      },
      currency_code: currency
    })
    
    const tax_total = taxBreakdown.tax_total
    const shipping_total = 0
    const discount_total = 0
    const calculated_total = subtotal + tax_total + shipping_total - discount_total
    
    console.log(`[Stripe Bypass] Tax calculation:`, {
      subtotal,
      tax_rate: (taxBreakdown.tax_rate * 100).toFixed(2) + '%',
      tax_name: taxBreakdown.tax_name,
      tax_total,
      calculated_total,
      provided_amount: amount
    })

    // Step 4: Create the order with "pending" status
    const orderData = {
      email: finalEmail,
      currency_code: currency,
      customer_id: customer?.id,
      region_id: regionId,
      
      billing_address: finalBillingAddress,
      shipping_address: finalShippingAddress,

      // Order items
      items: finalItems.map(item => ({
        title: item.title,
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.unit_price * item.quantity,
        metadata: {
          ...item.metadata,
          source: 'stripe_bypass'
        }
      })),

      // Totals - use calculated total with tax
      total: calculated_total,
      subtotal: subtotal,
      tax_total: tax_total,
      shipping_total: shipping_total,
      discount_total: discount_total,

      // Store important metadata
      metadata: {
        ...metadata,
        created_from: 'stripe_bypass',
        source: 'bypass_endpoint',
        checkout_type: 'bypass_order_first',
        original_amount: amount,
        bypass_reason: "direct_stripe_integration",
        tax_calculation: {
          tax_rate: taxBreakdown.tax_rate,
          tax_name: taxBreakdown.tax_name,
          tax_jurisdiction: taxBreakdown.tax_details[0]?.jurisdiction || 'Unknown',
          tax_summary: getTaxSummary(taxBreakdown, currency)
        }
      }
    }

    console.log("[Stripe Bypass] Creating order with data:", {
      email: orderData.email,
      customer_id: orderData.customer_id,
      region_id: orderData.region_id,
      total: orderData.total,
      itemCount: orderData.items.length,
      metadata_keys: Object.keys(orderData.metadata)
    })

    // Create the order
    const orders = await orderService.createOrders(orderData as any)
    const order = Array.isArray(orders) ? orders[0] : orders
    
    if (!order) {
      throw new Error("Failed to create order")
    }

    console.log(`[Stripe Bypass] ✅ Order created successfully: ${order.id}`)

    // Step 5: Create Stripe payment intent with order_id in metadata
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: calculated_total, // Use calculated total with tax
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_id: order.id, // This is the key - use order_id instead of just metadata
        email: finalEmail,
        customer_name: customer_name || `${finalShippingAddress.first_name} ${finalShippingAddress.last_name}`,
        source: 'stripe_bypass',
        bypass_reason: "direct_stripe_integration",
        subtotal: subtotal.toString(),
        tax_total: tax_total.toString(),
        tax_rate: (taxBreakdown.tax_rate * 100).toFixed(2) + '%',
        tax_name: taxBreakdown.tax_name,
        ...metadata // Include any additional metadata from request
      },
      description: `Order ${order.id} - Bypass Payment (${finalItems.length} item(s))`,
      receipt_email: finalEmail,
      shipping: shipping_address ? {
        name: `${finalShippingAddress.first_name} ${finalShippingAddress.last_name}`,
        address: {
          line1: finalShippingAddress.address_1,
          line2: finalShippingAddress.address_2 || undefined,
          city: finalShippingAddress.city,
          state: finalShippingAddress.province,
          postal_code: finalShippingAddress.postal_code,
          country: finalShippingAddress.country_code.toUpperCase(),
        },
      } : undefined,
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    console.log(`[Stripe Bypass] ✅ Payment intent created: ${paymentIntent.id}`)

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
      amount: calculated_total,
      currency: currency,
      payment_intent_id: paymentIntent.id,
      tax_breakdown: {
        subtotal,
        tax_total,
        tax_rate: taxBreakdown.tax_rate,
        tax_name: taxBreakdown.tax_name,
        total: calculated_total,
        tax_summary: getTaxSummary(taxBreakdown, currency)
      },
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
    console.error("[Stripe Bypass] Error:", error)
    return res.status(500).json({
      success: false,
      error: error.message
    })
  }
}