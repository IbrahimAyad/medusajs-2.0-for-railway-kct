/**
 * Auth Password Registered Subscriber
 * Creates customer record when user registers with email/password
 */

import { Modules } from '@medusajs/framework/utils'
import { ICustomerModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

export default async function authPasswordRegisteredHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const customerModuleService: ICustomerModuleService = container.resolve(Modules.CUSTOMER)

  try {
    console.log(`📧 Email/password registration event:`, data)

    // The entity_id is usually the email for emailpass provider
    const email = data.entity_id || data.email

    if (!email) {
      console.log('⚠️ No email found in registration data')
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

    // Create customer with registration data
    const customerData: any = {
      email: email,
    }

    // Extract metadata if available
    if (data.app_metadata?.first_name) {
      customerData.first_name = data.app_metadata.first_name
    }
    if (data.app_metadata?.last_name) {
      customerData.last_name = data.app_metadata.last_name
    }

    const customers = await customerModuleService.createCustomers(customerData)
    const customer = Array.isArray(customers) ? customers[0] : customers

    console.log(`✅ Customer created from registration:`, {
      customer_id: customer.id,
      email: customer.email
    })

  } catch (error) {
    console.error('Error in password registration handler:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'auth.password.registered'
}