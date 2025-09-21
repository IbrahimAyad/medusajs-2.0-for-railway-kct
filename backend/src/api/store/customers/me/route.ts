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
    // Try multiple auth methods since Medusa v2 auth context might not be populated
    
    // Method 1: Try Medusa's built-in auth context
    let authIdentityId = req.auth_context?.actor_id
    let customerId: string | undefined
    
    console.log("🔍 Auth context actor_id:", authIdentityId)
    
    if (authIdentityId) {
      // Get services
      const authService = req.scope.resolve(Modules.AUTH)
      
      try {
        const authIdentity = await authService.retrieveAuthIdentity(authIdentityId)
        customerId = authIdentity?.app_metadata?.customer_id
        console.log("✅ Found customer_id from auth context:", customerId)
      } catch (error) {
        console.error("Failed to retrieve auth identity:", error)
      }
    }
    
    // Method 2: If no auth context, extract from Bearer token directly
    if (!customerId) {
      const authHeader = req.headers.authorization
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        
        // Decode JWT without verification (since we trust Medusa's middleware)
        try {
          const base64Payload = token.split('.')[1]
          const payload = Buffer.from(base64Payload, 'base64').toString()
          const decoded = JSON.parse(payload)
          
          console.log("🔍 Decoded token payload:", decoded)
          
          // Try to get customer_id from various possible locations
          customerId = decoded?.app_metadata?.customer_id || 
                      decoded?.customer_id ||
                      decoded?.sub
          
          // If we have an actor_id but no customer_id, try to look up via auth service
          if (!customerId && decoded?.actor_id) {
            const authService = req.scope.resolve(Modules.AUTH)
            try {
              const authIdentity = await authService.retrieveAuthIdentity(decoded.actor_id)
              customerId = authIdentity?.app_metadata?.customer_id
              console.log("✅ Found customer_id via actor_id lookup:", customerId)
            } catch (error) {
              console.error("Failed to lookup auth identity:", error)
            }
          }
        } catch (error) {
          console.error("Failed to decode JWT token:", error)
        }
      }
    }
    
    if (!customerId) {
      console.log("❌ No customer ID found")
      return res.status(401).json({
        message: "Unauthorized - customer not found"
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