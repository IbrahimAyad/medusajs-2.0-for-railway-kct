import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Simplified Customer Detail Route for Medusa 2.10.1
 */

// GET /admin/customers/:id
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Retrieve customer
    const customer = await customerModuleService.retrieveCustomer(id)

    res.json({
      customer
    })

  } catch (error: any) {
    console.error("[Customer Detail] Error:", error)
    
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }
    
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

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Update customer
    const updatedCustomer = await customerModuleService.updateCustomers(
      id,
      updateData
    )

    res.json({
      customer: updatedCustomer
    })

  } catch (error: any) {
    console.error("[Customer Update] Error:", error)
    res.status(500).json({
      error: "Failed to update customer",
      message: error.message
    })
  }
}

// DELETE /admin/customers/:id
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Delete customer
    await customerModuleService.deleteCustomers(id)

    res.status(200).json({
      id,
      object: "customer",
      deleted: true
    })

  } catch (error: any) {
    console.error("[Customer Delete] Error:", error)
    res.status(500).json({
      error: "Failed to delete customer",
      message: error.message
    })
  }
}