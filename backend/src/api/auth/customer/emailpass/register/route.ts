/**
 * Custom registration endpoint that ensures customer is created and linked
 * This overrides the default registration to add customer creation
 */

import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

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

    // First, register the auth identity
    const authIdentity = await authService.register("emailpass", {
      entity_id: email,
      provider_metadata: {
        email,
        password,
      }
    })

    console.log(`✅ Auth identity created: ${authIdentity.id}`)

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

    // CRITICAL: Link the auth identity to the customer
    try {
      await authService.updateAuthIdentities([{
        id: authIdentity.id,
        app_metadata: {
          ...authIdentity.app_metadata,
          customer_id: customer.id
        }
      }])
      console.log(`🔗 Successfully linked auth identity ${authIdentity.id} to customer ${customer.id}`)
    } catch (linkError) {
      console.error(`❌ Failed to link auth identity to customer:`, linkError)
    }

    // Authenticate and return token
    const authResult = await authService.authenticate("emailpass", {
      entity_id: email,
      provider_metadata: {
        email,
        password,
      }
    })

    return res.json({
      token: authResult.jwt,
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