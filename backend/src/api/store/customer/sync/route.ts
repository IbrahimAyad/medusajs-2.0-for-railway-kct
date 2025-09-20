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
    const { email, token } = req.body as { email?: string; token?: string }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      })
    }

    console.log(`🔄 Customer sync requested for: ${email}`)

    const customerService = req.scope.resolve(Modules.CUSTOMER)

    // Check if customer exists
    const [existingCustomers] = await customerService.listAndCountCustomers({
      email: email,
    })

    let customer

    if (existingCustomers.length > 0) {
      customer = existingCustomers[0]
      console.log(`✅ Found existing customer: ${customer.id}`)

      // Customer already exists
      console.log(`✅ Customer already registered`)
    } else {
      // Create new customer
      const customerData = {
        email: email,
      }

      const createdCustomers = await customerService.createCustomers(customerData)
      customer = Array.isArray(createdCustomers) ? createdCustomers[0] : createdCustomers
      console.log(`✅ Created new customer: ${customer.id}`)
    }

    // Try to link auth identity from request context
    try {
      const authService = req.scope.resolve(Modules.AUTH)

      // Get current authenticated user from request context
      const authUser = req.auth?.actor_id || req.user?.id || req.auth?.user?.id

      if (authUser) {
        console.log(`🔗 Found authenticated user: ${authUser}`)

        // Find auth identity for the authenticated user
        const authIdentities = await authService.listAuthIdentities({
          entity_id: authUser
        })

        if (authIdentities.length > 0) {
          const authIdentity = authIdentities[0]
          console.log(`🔗 Found auth identity: ${authIdentity.id}`)

          // Update auth identity with customer_id in app_metadata
          await authService.updateAuthIdentities([{
            id: authIdentity.id,
            app_metadata: {
              ...authIdentity.app_metadata,
              customer_id: customer.id,
            },
          }])
          console.log(`✅ Linked auth identity ${authIdentity.id} to customer ${customer.id}`)
        } else {
          console.log(`⚠️ No auth identity found for user: ${authUser}`)
        }
      } else {
        console.log(`⚠️ No authenticated user found in request context`)

        // Fallback: Try to find auth identity by email
        if (token) {
          const authIdentities = await authService.listAuthIdentities({
            provider_identities: {
              entity_id: email
            }
          })

          if (authIdentities.length > 0) {
            const authIdentity = authIdentities[0]
            await authService.updateAuthIdentities([{
              id: authIdentity.id,
              app_metadata: {
                ...authIdentity.app_metadata,
                customer_id: customer.id,
              },
            }])
            console.log(`✅ Linked auth identity via email fallback`)
          }
        }
      }
    } catch (linkError) {
      console.log("⚠️ Could not link auth identity:", linkError.message)
      // Continue anyway - customer is created
    }

    return res.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        has_account: true,
        created_at: customer.created_at,
      }
    })

  } catch (error) {
    console.error("❌ Error in customer sync:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to sync customer",
      error: error.message
    })
  }
}