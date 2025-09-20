/**
 * API Endpoint to Ensure Customer Creation After Registration
 * This is called by the frontend after successful registration
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createCustomerAfterAuthWorkflow } from "../../../workflows/create-customer-after-auth"
import { Modules } from "@medusajs/framework/utils"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      })
    }

    // Try to find auth identity for this email
    let authIdentityId: string | undefined
    try {
      const authService = req.scope.resolve(Modules.AUTH)
      const authIdentities = await authService.listAuthIdentities({
        provider_identities: {
          user_metadata: {
            email
          }
        }
      })

      if (authIdentities.length > 0) {
        authIdentityId = authIdentities[0].id
      }
    } catch (error) {
      console.log("Could not find auth identity, proceeding without linking")
    }

    // Execute the workflow
    const result = await createCustomerAfterAuthWorkflow.run({
      input: {
        email,
        authIdentityId
      },
      container: req.scope
    })

    res.json({
      success: true,
      customer_id: result.customer_id,
      created: result.created
    })
  } catch (error) {
    console.error("Error ensuring customer:", error)
    res.status(500).json({
      message: "Failed to ensure customer",
      error: error.message
    })
  }
}