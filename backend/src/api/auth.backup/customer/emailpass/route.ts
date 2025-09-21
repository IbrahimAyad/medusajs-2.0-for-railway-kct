/**
 * Login endpoint for customer authentication
 * Returns JWT token for authenticated users
 */

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { generateJwtToken } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { email, password } = req.body as any

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      })
    }

    console.log(`🔐 Login attempt for: ${email}`)

    const authService = req.scope.resolve(Modules.AUTH)
    const customerService = req.scope.resolve(Modules.CUSTOMER)

    try {
      // Authenticate user
      const authResult = await authService.authenticate("emailpass", {
        entity_id: email,
        provider_metadata: {
          password
        }
      } as any)

      console.log(`✅ Authentication successful for: ${email}`)

      // Get customer record
      const [customers] = await customerService.listAndCountCustomers({
        email: email,
      })

      let customer = customers[0]

      // If customer doesn't exist (shouldn't happen but just in case)
      if (!customer) {
        console.log(`⚠️ No customer found for authenticated user: ${email}`)
        // Create customer
        const createdCustomers = await customerService.createCustomers({
          email: email,
          has_account: true
        })
        customer = Array.isArray(createdCustomers) ? createdCustomers[0] : createdCustomers
        console.log(`✅ Created customer: ${customer.id}`)
      }

      // Generate JWT token
      const secret = process.env.JWT_SECRET || "supersecret"
      const token = generateJwtToken(
        {
          actor_id: authResult.authIdentity?.id,
          actor_type: "customer",
          auth_identity_id: authResult.authIdentity?.id,
          app_metadata: {
            customer_id: customer.id
          }
        },
        {
          secret,
          expiresIn: "7d"
        }
      )

      console.log(`✅ Login successful for: ${email}, customer: ${customer.id}`)

      return res.json({
        token,
        customer: {
          id: customer.id,
          email: customer.email,
          first_name: customer.first_name,
          last_name: customer.last_name,
          has_account: customer.has_account
        }
      })

    } catch (authError: any) {
      console.error(`❌ Authentication failed for ${email}:`, authError.message)
      return res.status(401).json({
        message: "Invalid email or password"
      })
    }

  } catch (error: any) {
    console.error("❌ Login error:", error)
    return res.status(500).json({
      message: error.message || "Login failed"
    })
  }
}