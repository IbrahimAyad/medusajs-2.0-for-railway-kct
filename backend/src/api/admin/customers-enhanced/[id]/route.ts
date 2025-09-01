import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Enhanced Customer Detail Route with Order History and Analytics
 */

// GET /admin/customers-enhanced/:id - Get customer with full details
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const { 
      include_orders = true,
      include_addresses = true,
      include_groups = true,
      include_analytics = false
    } = req.query
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    // Build relations array based on query params
    const relations: string[] = []
    if (include_addresses === 'true') relations.push('addresses')
    if (include_groups === 'true') relations.push('groups')
    
    // Retrieve customer with relations
    const customer = await customerModuleService.retrieveCustomer(id, {
      relations
    })
    
    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }
    
    // Initialize enhanced customer object
    let enhancedCustomer: any = { ...customer }
    
    // Fetch order history if requested
    if (include_orders === 'true') {
      try {
        const [orders, orderCount] = await orderModuleService.listAndCountOrders(
          { customer_id: id },
          {
            take: 10,  // Last 10 orders
            order: { created_at: 'DESC' },
            relations: ['items', 'shipping_address', 'payments']
          }
        )
        
        enhancedCustomer.orders = orders
        enhancedCustomer.total_orders = orderCount
      } catch (error) {
        console.log("Orders not available for customer:", error)
        enhancedCustomer.orders = []
        enhancedCustomer.total_orders = 0
      }
    }
    
    // Calculate customer analytics if requested
    if (include_analytics === 'true') {
      const analytics = {
        customer_lifetime_value: 0,
        average_order_value: 0,
        order_frequency: 0,
        days_since_last_order: null,
        preferred_payment_method: null,
        preferred_shipping_address: null,
        account_age_days: 0,
        risk_score: "low" // low, medium, high
      }
      
      // Calculate account age
      const createdDate = new Date(customer.created_at)
      const currentDate = new Date()
      analytics.account_age_days = Math.floor(
        (currentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      
      // Calculate order-based analytics if orders are available
      if (enhancedCustomer.orders && enhancedCustomer.orders.length > 0) {
        // Customer lifetime value
        analytics.customer_lifetime_value = enhancedCustomer.orders.reduce(
          (sum: number, order: any) => sum + (order.total || 0), 0
        )
        
        // Average order value
        analytics.average_order_value = enhancedCustomer.total_orders > 0
          ? analytics.customer_lifetime_value / enhancedCustomer.total_orders
          : 0
          
        // Days since last order
        const lastOrder = enhancedCustomer.orders[0]
        if (lastOrder) {
          const lastOrderDate = new Date(lastOrder.created_at)
          analytics.days_since_last_order = Math.floor(
            (currentDate.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        }
        
        // Order frequency (orders per month)
        if (analytics.account_age_days > 0) {
          analytics.order_frequency = (enhancedCustomer.total_orders / analytics.account_age_days) * 30
        }
      }
      
      // Risk scoring based on various factors
      if (analytics.customer_lifetime_value > 1000 && enhancedCustomer.total_orders > 5) {
        analytics.risk_score = "low"
      } else if (enhancedCustomer.total_orders > 0) {
        analytics.risk_score = "medium"
      } else {
        analytics.risk_score = "high"
      }
      
      enhancedCustomer.analytics = analytics
    }
    
    // Add customer tags/segments
    enhancedCustomer.segments = []
    
    // VIP customer
    if (enhancedCustomer.analytics?.customer_lifetime_value > 5000) {
      enhancedCustomer.segments.push("VIP")
    }
    
    // Frequent buyer
    if (enhancedCustomer.analytics?.order_frequency > 1) {
      enhancedCustomer.segments.push("Frequent Buyer")
    }
    
    // New customer
    if (enhancedCustomer.analytics?.account_age_days < 30) {
      enhancedCustomer.segments.push("New Customer")
    }
    
    // At risk of churning
    if (enhancedCustomer.analytics?.days_since_last_order > 90) {
      enhancedCustomer.segments.push("At Risk")
    }

    res.json({
      customer: enhancedCustomer
    })

  } catch (error: any) {
    console.error("[Enhanced Customer Detail] Error:", error)
    
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }
    
    res.status(500).json({
      error: "Failed to fetch customer details",
      message: error.message
    })
  }
}

// POST /admin/customers-enhanced/:id/notes - Add note to customer
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const body = req.body as {
      note?: string
      type?: string
    }
    
    const { note, type = "general" } = body
    
    if (!note) {
      return res.status(400).json({
        error: "Note content is required"
      })
    }
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Retrieve current customer
    const customer = await customerModuleService.retrieveCustomer(id)
    
    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }
    
    // Add note to metadata
    const currentNotes = (customer.metadata?.notes || []) as any[]
    const newNote = {
      id: `note_${Date.now()}`,
      content: note,
      type,
      created_at: new Date().toISOString(),
      created_by: "admin" // In production, get from auth context
    }
    
    const updatedMetadata = {
      ...customer.metadata,
      notes: [...currentNotes, newNote]
    }
    
    // Update customer with new note
    const updatedCustomer = await customerModuleService.updateCustomers(
      id,
      { metadata: updatedMetadata } as any
    )
    
    res.json({
      success: true,
      note: newNote,
      customer: updatedCustomer
    })
    
  } catch (error: any) {
    console.error("[Customer Note Add] Error:", error)
    res.status(500).json({
      error: "Failed to add note",
      message: error.message
    })
  }
}