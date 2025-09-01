import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Customer Detail Route
 * Fixes the "An error occurred" when clicking on a customer
 */

// GET /admin/customers/:id - Get customer details
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        error: "Customer ID is required"
      })
    }

    console.log(`[Customer Detail] Fetching customer: ${id}`)

    // Resolve the customer module service
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Fetch the customer
    const customer = await customerModuleService.retrieveCustomer(id, {
      relations: ["addresses", "groups"]
    })

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found",
        message: `No customer found with ID: ${id}`
      })
    }

    // Get order statistics for this customer
    const query = req.scope.resolve("query")
    
    // Fetch order count and total spent
    const orderStats = await query.graph({
      entity: "order",
      fields: ["id", "total", "created_at"],
      filters: {
        customer_id: id
      }
    })

    // Calculate statistics
    const stats = {
      order_count: orderStats?.data?.length || 0,
      total_spent: orderStats?.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0,
      last_order_date: orderStats?.data?.[0]?.created_at || null
    }

    // Return customer with additional data
    res.json({
      customer: {
        ...customer,
        stats
      }
    })

  } catch (error) {
    console.error("[Customer Detail] Error:", error)
    res.status(500).json({
      error: "Failed to fetch customer",
      message: error.message
    })
  }
}

// POST /admin/customers/:id - Update customer
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const updateData = req.body

    console.log(`[Customer Update] Updating customer: ${id}`)

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Update the customer
    const updatedCustomer = await customerModuleService.updateCustomers({
      id,
      ...updateData
    })

    res.json({
      customer: updatedCustomer
    })

  } catch (error) {
    console.error("[Customer Update] Error:", error)
    res.status(500).json({
      error: "Failed to update customer",
      message: error.message
    })
  }
}

// DELETE /admin/customers/:id - Delete customer
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params

    console.log(`[Customer Delete] Deleting customer: ${id}`)

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Delete the customer
    await customerModuleService.deleteCustomers(id)

    res.json({
      success: true,
      message: "Customer deleted successfully"
    })

  } catch (error) {
    console.error("[Customer Delete] Error:", error)
    res.status(500).json({
      error: "Failed to delete customer",
      message: error.message
    })
  }
}