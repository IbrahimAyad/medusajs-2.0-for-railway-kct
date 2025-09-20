/**
 * Auth Identity Created Subscriber
 * Automatically creates customer records when auth identities are created
 * AND LINKS THEM via app_metadata.customer_id
 */

import { Modules } from '@medusajs/framework/utils'
import { ICustomerModuleService, IAuthModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

export default async function authIdentityCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('🔥🔥🔥 AUTH IDENTITY CREATED SUBSCRIBER LOADED!')
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  const authService: IAuthModuleService = container.resolve(Modules.AUTH)

  try {
    console.log(`🔐 Auth identity created event received - ID: ${data.id}`)

    // Get the full auth identity to access provider_identities
    let authIdentity
    try {
      authIdentity = await authService.retrieveAuthIdentity(data.id)
      console.log(`📧 Retrieved auth identity - Provider identities:`, authIdentity?.provider_identities?.length || 0)
    } catch (e) {
      console.log('⚠️ Could not retrieve auth identity:', e)
      return
    }

    // Extract email from the provider identity
    const email = authIdentity?.provider_identities?.[0]?.entity_id || data.entity_id || data.email

    if (!email) {
      console.log('⚠️ No email found in auth identity data')
      return
    }

    console.log(`📧 Processing auth identity for email: ${email}`)

    // Check if customer already exists
    const [existingCustomers] = await customerModuleService.listAndCountCustomers({
      email: email
    })

    let customer

    if (existingCustomers.length > 0) {
      customer = existingCustomers[0]
      console.log(`✅ Customer already exists for ${email} - ID: ${customer.id}`)
    } else {
      // Create new customer record
      const customerData: any = {
        email: email,
        has_account: true  // Mark as registered user
      }

      // Try to extract name from auth data if available
      if (data.provider_metadata?.first_name || data.first_name) {
        customerData.first_name = data.provider_metadata?.first_name || data.first_name
      }

      if (data.provider_metadata?.last_name || data.last_name) {
        customerData.last_name = data.provider_metadata?.last_name || data.last_name
      }

      const customers = await customerModuleService.createCustomers(customerData)
      customer = Array.isArray(customers) ? customers[0] : customers

      console.log(`✅ Customer record created for ${email} - ID: ${customer.id}`)
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

  } catch (error) {
    console.error('Error creating customer from auth identity:', error)
    // Don't throw - we don't want to break the auth flow
  }
}

export const config: SubscriberConfig = {
  event: 'auth.identity_created'
}