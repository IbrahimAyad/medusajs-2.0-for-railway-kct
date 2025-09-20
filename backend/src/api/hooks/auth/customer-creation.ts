/**
 * Authentication Hook for Customer Creation
 * This ensures customer records are created when users register
 * Works alongside subscribers as a fallback mechanism
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { auth_identity_id, provider_identity_id } = req.body

    if (!auth_identity_id || !provider_identity_id) {
      return res.status(400).json({
        message: "Missing required fields"
      })
    }

    const authIdentityService = req.scope.resolve(Modules.AUTH)
    const customerService = req.scope.resolve(Modules.CUSTOMER)

    // Get the auth identity details
    const authIdentity = await authIdentityService.retrieveAuthIdentity(
      auth_identity_id
    )

    if (!authIdentity) {
      return res.status(404).json({
        message: "Auth identity not found"
      })
    }

    // Get provider identity for email
    const providerIdentities = await authIdentityService.listProviderIdentities(
      {
        auth_identity_id: auth_identity_id,
      }
    )

    const emailProvider = providerIdentities.find(
      (pi) => pi.entity_id === provider_identity_id
    )

    if (!emailProvider?.user_metadata?.email) {
      return res.status(400).json({
        message: "No email found in auth identity"
      })
    }

    const email = emailProvider.user_metadata.email

    // Check if customer exists
    const existingCustomers = await customerService.listCustomers({
      email,
    })

    if (existingCustomers.length > 0) {
      return res.json({
        message: "Customer already exists",
        customer_id: existingCustomers[0].id
      })
    }

    // Create the customer
    const customer = await customerService.createCustomers({
      email,
      has_account: true,
    })

    // Link auth identity to customer
    await authIdentityService.update(auth_identity_id, {
      app_metadata: {
        customer_id: customer.id,
      },
    })

    console.log(`✅ Customer created via API hook: ${customer.id} for ${email}`)

    res.json({
      message: "Customer created successfully",
      customer_id: customer.id
    })
  } catch (error) {
    console.error("Error in customer creation hook:", error)
    res.status(500).json({
      message: "Failed to create customer",
      error: error.message
    })
  }
}