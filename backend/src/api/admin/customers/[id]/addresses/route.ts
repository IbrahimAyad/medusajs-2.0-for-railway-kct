import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Customer Addresses Route
 * Manage customer addresses
 */

// GET /admin/customers/:id/addresses - List customer addresses
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params

    console.log(`[Customer Addresses] Fetching addresses for customer: ${id}`)

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Fetch customer with addresses
    const customer = await customerModuleService.retrieveCustomer(id, {
      relations: ["addresses"]
    })

    if (!customer) {
      return res.status(404).json({
        error: "Customer not found"
      })
    }

    res.json({
      addresses: customer.addresses || []
    })

  } catch (error) {
    console.error("[Customer Addresses] Error:", error)
    res.status(500).json({
      error: "Failed to fetch addresses",
      message: error.message
    })
  }
}

// POST /admin/customers/:id/addresses - Add address to customer
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const addressData = req.body

    console.log(`[Customer Address Create] Adding address for customer: ${id}`)

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Create address for customer
    const address = await customerModuleService.createAddress({
      ...(addressData as any),
      customer_id: id
    })

    res.status(201).json({
      address
    })

  } catch (error) {
    console.error("[Customer Address Create] Error:", error)
    res.status(500).json({
      error: "Failed to create address",
      message: error.message
    })
  }
}