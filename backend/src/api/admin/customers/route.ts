import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Simplified Customer List Route for Medusa 2.10.1
 */

// GET /admin/customers - List customers
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { q, limit = 50, offset = 0 } = req.query

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Build filters
    const filters: any = {}
    if (q) {
      filters.$or = [
        { email: { $ilike: `%${q}%` } },
        { first_name: { $ilike: `%${q}%` } },
        { last_name: { $ilike: `%${q}%` } }
      ]
    }

    // List customers
    const [customers, count] = await customerModuleService.listAndCountCustomers(
      filters,
      {
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }
    )

    res.json({
      customers,
      count,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string)
    })

  } catch (error: any) {
    console.error("[Customer List] Error:", error)
    res.status(500).json({
      error: "Failed to list customers",
      message: error.message
    })
  }
}

// POST /admin/customers - Create customer
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerData = req.body

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Create customer
    const customer = await customerModuleService.createCustomers(customerData)

    res.status(201).json({
      customer
    })

  } catch (error: any) {
    console.error("[Customer Create] Error:", error)
    
    if (error.message?.includes("already exists")) {
      return res.status(409).json({
        error: "Customer already exists"
      })
    }
    
    res.status(500).json({
      error: "Failed to create customer",
      message: error.message
    })
  }
}