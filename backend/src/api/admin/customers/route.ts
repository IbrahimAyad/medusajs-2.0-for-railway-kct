import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Customers List Route
 * Handles customer listing and creation
 */

// GET /admin/customers - List all customers
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      q, // search query
      groups,
      created_at
    } = req.query

    console.log("[Customers List] Fetching customers...")

    // Resolve the customer module service
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

    if (groups) {
      filters.groups = { id: groups }
    }

    // List customers with pagination
    const [customers, count] = await customerModuleService.listAndCountCustomers(
      filters,
      {
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        relations: ["addresses", "groups"],
        order: { created_at: "DESC" }
      }
    )

    res.json({
      customers,
      count,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string)
    })

  } catch (error) {
    console.error("[Customers List] Error:", error)
    res.status(500).json({
      error: "Failed to fetch customers",
      message: error.message
    })
  }
}

// POST /admin/customers - Create a new customer
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerData = req.body as any

    console.log("[Customer Create] Creating new customer...")

    // Validate required fields
    if (!customerData?.email) {
      return res.status(400).json({
        error: "Email is required"
      })
    }

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Check if customer already exists
    const existingCustomers = await customerModuleService.listCustomers({
      email: customerData.email
    })

    if (existingCustomers.length > 0) {
      return res.status(409).json({
        error: "Customer already exists",
        message: `A customer with email ${customerData.email} already exists`
      })
    }

    // Create the customer
    const customer = await customerModuleService.createCustomers({
      ...(customerData as any),
      has_account: customerData.has_account || false
    })

    console.log(`[Customer Create] Created customer: ${(customer as any).id || (customer[0] as any).id}`)

    res.status(201).json({
      customer
    })

  } catch (error) {
    console.error("[Customer Create] Error:", error)
    res.status(500).json({
      error: "Failed to create customer",
      message: error.message
    })
  }
}