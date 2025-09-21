/**
 * Get current customer profile
 * Uses Medusa's built-in authentication middleware
 */

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IAuthModuleService } from "@medusajs/framework/types"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  try {
    // The authenticate middleware populates req.auth_context with actor_id
    // For customer authentication, actor_id is the auth identity ID
    const authIdentityId = req.auth_context?.actor_id
    
    if (!authIdentityId) {
      console.log("❌ No actor ID in auth context")
      return res.status(401).json({
        message: "Not authenticated"
      })
    }

    console.log("✅ Auth Identity ID from auth context:", authIdentityId)

    // Get the customer_id from the auth identity's app_metadata
    const authService = req.scope.resolve(Modules.AUTH)
    let customerId: string | undefined

    try {
      const authIdentity = await authService.retrieveAuthIdentity(authIdentityId)
      customerId = authIdentity?.app_metadata?.customer_id as string | undefined
      console.log("✅ Customer ID from app_metadata:", customerId)
    } catch (error) {
      console.error("Failed to retrieve auth identity:", error)
      return res.status(500).json({
        message: "Failed to retrieve auth identity"
      })
    }

    if (!customerId) {
      console.log("❌ No customer ID in auth identity app_metadata")
      return res.status(401).json({
        message: "Customer not linked to auth identity"
      })
    }

    // Get customer data
    const customerService = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customerService.retrieveCustomer(customerId, {
      relations: ['addresses']
    })

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      })
    }

    // Return customer data
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