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
    
    console.log("🔍 Auth context keys:", Object.keys(authContext))
    console.log("🔍 Headers:", req.headers)
    
    // Try to get customer ID from auth context (set by middleware)
    let customerId = authContext.auth_context?.customer_id || 
                     authContext.auth?.customer_id ||
                     authContext.user?.customer_id

    console.log("🔍 Customer ID from context:", customerId)

    // If no customer ID in context, try to extract from JWT token
    if (!customerId) {
      const authHeader = req.headers.authorization
      console.log("🔍 Auth header:", authHeader)
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        console.log("🔍 Token length:", token.length)
        
        try {
          // Get JWT secret from environment
          const secret = process.env.JWT_SECRET || "zef1v4cu2uojku5jlwq7mzo7g7n0lq8u"
          console.log("🔍 Using JWT secret:", secret.substring(0, 10) + "...")
          
          // Verify and decode JWT token
          const decoded = verifyJwtToken(token, {
            secret
          }) as any
          
          console.log("✅ Decoded JWT token:", JSON.stringify(decoded, null, 2))
          
          // Get customer_id from app_metadata
          customerId = decoded?.app_metadata?.customer_id
          console.log("✅ Customer ID from token:", customerId)
        } catch (error: any) {
          console.error("❌ Failed to verify JWT token:", error.message || error)
          console.error("Full error:", error)
        }
      }
    }

    if (!customerId) {
      console.log("❌ No customer ID found, returning 401")
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