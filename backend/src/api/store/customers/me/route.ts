/**
 * Get current customer profile
 * Returns authenticated customer data
 */

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Step 1: Get auth identity from Medusa's built-in auth context
    const authIdentityId = req.auth_context?.actor_id
    
    console.log("🔍 Auth context actor_id:", authIdentityId)
    
    if (!authIdentityId) {
      console.log("❌ No auth identity found in context")
      return res.status(401).json({
        message: "Unauthorized - not authenticated"
      })
    }

    // Step 2: Get services
    const authService = req.scope.resolve(Modules.AUTH)
    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    // Step 3: Get customer_id from auth identity's app_metadata
    let customerId: string | undefined
    
    try {
      const authIdentity = await authService.retrieveAuthIdentity(authIdentityId)
      customerId = authIdentity?.app_metadata?.customer_id
      console.log("✅ Found customer_id in app_metadata:", customerId)
    } catch (error) {
      console.error("❌ Failed to retrieve auth identity:", error)
      return res.status(401).json({
        message: "Unauthorized - invalid authentication"
      })
    }
    
    if (!customerId) {
      console.log("❌ No customer linked to auth identity")
      return res.status(401).json({
        message: "Unauthorized - customer not linked"
      })
    }

    // Step 4: Get customer data with addresses
    const customer = await customerService.retrieveCustomer(customerId, {
      relations: ['addresses']
    })

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      })
    }

    // Step 5: Return customer data
    return res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone,
        has_account: customer.has_account,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
        addresses: customer.addresses || [],
        metadata: customer.metadata || {}
      }
    })

  } catch (error: any) {
    console.error("❌ Get customer profile error:", error.message)
    return res.status(500).json({
      message: error.message || "Failed to get customer profile"
    })
  }
}