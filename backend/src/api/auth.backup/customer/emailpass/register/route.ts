/**
 * Custom registration endpoint that ensures customer is created and linked
 * This overrides the default registration to add customer creation
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
    const { email, password, first_name, last_name } = req.body as any

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      })
    }

    console.log(`🔐 Registration request for: ${email}`)

    const authService = req.scope.resolve(Modules.AUTH)
    const customerService = req.scope.resolve(Modules.CUSTOMER)

    // First, register the auth identity using SAME pattern as login
    // The key difference: register expects password in provider_metadata
    const authIdentity = await authService.register("emailpass", {
      entity_id: email,
      provider_metadata: {
        password  // Just password, not email and password
      }
    } as any)

    console.log(`✅ Auth identity registered for: ${email}`)

    // Check if customer already exists
    const [existingCustomers] = await customerService.listAndCountCustomers({
      email: email,
    })

    let customer

    if (existingCustomers.length > 0) {
      customer = existingCustomers[0]
      console.log(`✅ Found existing customer: ${customer.id}`)
    } else {
      // Create new customer
      const customerData: any = {
        email: email,
        first_name: first_name || undefined,
        last_name: last_name || undefined,
        has_account: true
      }

      const createdCustomers = await customerService.createCustomers(customerData)
      customer = Array.isArray(createdCustomers) ? createdCustomers[0] : createdCustomers
      console.log(`✅ Created new customer: ${customer.id}`)
    }

    // Link the auth identity to the customer
    try {
      await authService.updateAuthIdentities([{
        id: authIdentity.id,
        app_metadata: {
          ...authIdentity.app_metadata,
          customer_id: customer.id
        }
      }])
      console.log(`✅ Linked auth identity to customer: ${customer.id}`)
    } catch (linkError) {
      console.error(`⚠️ Failed to link auth identity:`, linkError)
    }

    // Generate JWT token for the new user - SAME pattern as login
    const secret = process.env.JWT_SECRET || "supersecret"
    const token = generateJwtToken(
      {
        actor_id: authIdentity.id,
        actor_type: "customer",
        auth_identity_id: authIdentity.id,
        app_metadata: {
          customer_id: customer.id
        }
      },
      {
        secret,
        expiresIn: "7d"
      }
    )

    console.log(`✅ Registration successful, JWT token generated for: ${email}`)

    return res.json({
      token: token,
      customer: {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        has_account: true
      }
    })

  } catch (error: any) {
    console.error("❌ Registration error:", error)
    return res.status(400).json({
      message: error.message || "Registration failed"
    })
  }
}