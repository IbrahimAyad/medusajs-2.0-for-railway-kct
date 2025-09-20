/**
 * Loader to ensure customer creation after authentication
 * This runs at application startup and sets up event listeners
 */

import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function ensureCustomerOnAuthLoader(
  container: MedusaContainer
): Promise<void> {
  console.log("🔄 Setting up customer creation on authentication...")

  try {
    const eventBus = container.resolve(Modules.EVENT_BUS)
    const customerService = container.resolve(Modules.CUSTOMER)
    const authService = container.resolve(Modules.AUTH)

    // Listen for auth identity created events
    await eventBus.subscribe("auth.identity_created", async (data: any) => {
      console.log("🔔 AUTH.IDENTITY_CREATED event received:", data)

      try {
        const { authIdentityId } = data

        if (!authIdentityId) {
          console.log("❌ No auth identity ID in event data")
          return
        }

        // Get auth identity details
        const authIdentity = await authService.retrieveAuthIdentity(authIdentityId)
        if (!authIdentity) {
          console.log("❌ Auth identity not found:", authIdentityId)
          return
        }

        // Get provider identity for email
        const providerIdentities = await authService.listProviderIdentities({
          auth_identity_id: authIdentityId,
        })

        const emailProvider = providerIdentities.find(
          (pi: any) => pi.provider === "emailpass"
        )

        if (!emailProvider?.user_metadata?.email) {
          console.log("❌ No email found in auth identity")
          return
        }

        const email = emailProvider.user_metadata.email

        // Check if customer already exists
        const existingCustomers = await customerService.listCustomers({
          email,
        })

        if (existingCustomers.length > 0) {
          console.log(`✅ Customer already exists for ${email}`)
          return
        }

        // Create the customer
        const customer = await customerService.createCustomers({
          email: email as string,
          has_account: true,
        })

        // Link auth identity to customer
        await authService.updateAuthIdentities([{
          id: authIdentityId,
          app_metadata: {
            customer_id: customer.id,
          },
        }])

        console.log(`✅ Customer created via loader: ${customer.id} for ${email}`)
      } catch (error) {
        console.error("❌ Error creating customer in loader:", error)
      }
    })

    console.log("✅ Customer creation loader set up successfully")
  } catch (error) {
    console.error("❌ Failed to set up customer creation loader:", error)
  }
}