/**
 * Auth Identity Created Subscriber
 * Automatically creates customer records when auth identities are created
 */

import { Modules } from '@medusajs/framework/utils'
import { ICustomerModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

export default async function authIdentityCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('🔥🔥🔥 AUTH IDENTITY CREATED SUBSCRIBER LOADED!')
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

  try {
    console.log(`🔐 Auth identity created event received for:`, data.entity_id || data.email)

    // Extract email from the auth identity data
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

    const customers = await customerModuleService.createCustomers(customerData)
    const customer = Array.isArray(customers) ? customers[0] : customers

    console.log(`✅ Customer record created for ${email}`, {
      customer_id: customer.id,
      email: customer.email,
      name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    })

  } catch (error) {
    console.error('Error creating customer from auth identity:', error)
    // Don't throw - we don't want to break the auth flow
  }
}

export const config: SubscriberConfig = {
  event: 'auth.identity_created'
}