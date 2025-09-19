/**
 * Auth to Customer Synchronization
 * Automatically creates customer records when auth identities are created
 */

import { Modules } from '@medusajs/framework/utils'
import {
  ICustomerModuleService,
  IAuthModuleService
} from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

/**
 * Handle Auth Identity Creation
 * Automatically creates a corresponding customer record
 */
export async function handleAuthIdentityCreated({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)
  const authModuleService: IAuthModuleService = container.resolve(Modules.AUTH)

  try {
    console.log(`🔐 Auth identity created event received`, data)

    // Extract email from the auth identity data
    // The structure might vary based on the auth provider
    const email = data.entity_id || data.email || data.provider_metadata?.email

    if (!email) {
      console.log('⚠️ No email found in auth identity data')
      return
    }

    // Check if customer already exists
    const [existingCustomers] = await customerModuleService.listAndCountCustomers({
      email: email
    })

    if (existingCustomers.length > 0) {
      console.log(`✅ Customer already exists for ${email}`)
      return
    }

    // Create new customer record
    const customerData: any = {
      email: email,
    }

    // Try to extract name from auth data if available
    if (data.provider_metadata?.first_name || data.first_name) {
      customerData.first_name = data.provider_metadata?.first_name || data.first_name
    }

    if (data.provider_metadata?.last_name || data.last_name) {
      customerData.last_name = data.provider_metadata?.last_name || data.last_name
    }

    const customer = await customerModuleService.createCustomers(customerData)

    console.log(`✅ Customer record created for ${email}`, {
      customer_id: customer.id,
      email: customer.email,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    })

    // Link the auth identity to the customer
    // This ensures the customer can be retrieved when authenticated
    if (data.id) {
      try {
        // Store the customer ID in auth metadata for quick lookup
        await authModuleService.updateAuthIdentity(data.id, {
          app_metadata: {
            ...(data.app_metadata || {}),
            customer_id: customer.id
          }
        })
        console.log(`🔗 Linked auth identity to customer ${customer.id}`)
      } catch (linkError) {
        console.log('Could not update auth identity metadata:', linkError)
      }
    }

  } catch (error) {
    console.error('Error creating customer from auth identity:', error)
    // Don't throw - we don't want to break the auth flow
  }
}

/**
 * Handle customer email/password registration
 * This handles the specific case of email/password registration
 */
export async function handleCustomerRegistration({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

  try {
    // This event might contain more structured data for email/pass registration
    const { entity_id: email, provider_metadata } = data

    if (!email || data.provider !== 'emailpass') {
      return // Only handle emailpass provider
    }

    console.log(`📧 Email/password registration for ${email}`)

    // Check if customer already exists
    const [existingCustomers] = await customerModuleService.listAndCountCustomers({
      email: email
    })

    if (existingCustomers.length === 0) {
      // Create customer with registration data
      const customer = await customerModuleService.createCustomers({
        email: email,
        first_name: provider_metadata?.first_name || '',
        last_name: provider_metadata?.last_name || '',
      })

      console.log(`✅ Customer created from registration: ${customer.id}`)
    }
  } catch (error) {
    console.error('Error in customer registration handler:', error)
  }
}

// Export subscriber definitions
export default [
  {
    identifier: 'auth-identity-customer-sync',
    event: 'auth.identity_created',
    subscriber: handleAuthIdentityCreated,
  },
  {
    identifier: 'auth-password-customer-sync',
    event: 'auth.password.registered',
    subscriber: handleCustomerRegistration,
  },
  // Also listen for the generic auth created event
  {
    identifier: 'auth-created-customer-sync',
    event: 'auth.created',
    subscriber: handleAuthIdentityCreated,
  }
]

// Export config to ensure subscriber is loaded
export const config: SubscriberConfig = {
  event: [
    'auth.identity_created',
    'auth.password.registered',
    'auth.created'
  ],
  context: {
    subscriberId: 'auth-customer-sync',
  },
}