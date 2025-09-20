/**
 * Get current customer profile
 * Returns authenticated customer data
 */

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules, verifyJwtToken } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const authContext = req as any
    
    // Try to get customer ID from auth context (set by middleware)
    let customerId = authContext.auth_context?.customer_id || 
                     authContext.auth?.customer_id ||
                     authContext.user?.customer_id

    // If no customer ID in context, try to extract from JWT token
    if (!customerId) {
      const authHeader = req.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        
        try {
          // Get JWT secret from environment
          const secret = process.env.JWT_SECRET || "zef1v4cu2uojku5jlwq7mzo7g7n0lq8u"
          
          // Verify and decode JWT token
          const decoded = verifyJwtToken(token, {
            secret
          }) as any
          
          console.log("🔍 Decoded JWT token:", JSON.stringify(decoded, null, 2))
          
          // Get customer_id from app_metadata
          customerId = decoded?.app_metadata?.customer_id
        } catch (error) {
          console.error("Failed to verify JWT token:", error)
        }
      }
    }

    if (!customerId) {
      return res.status(401).json({
        message: "Unauthorized - no customer found"
      })
    }

    const customerService = req.scope.resolve(Modules.CUSTOMER)
    
    // Get customer with addresses
    const customer = await customerService.retrieveCustomer(customerId, {
      relations: ['addresses']
    })

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found"
      })
    }

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
    console.error("❌ Get customer profile error:", error)
    return res.status(500).json({
      message: error.message || "Failed to get customer profile"
    })
  }
}