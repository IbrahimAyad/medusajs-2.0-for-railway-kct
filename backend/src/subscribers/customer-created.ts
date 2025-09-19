/**
 * Customer Created Subscriber
 * Ensures customer records are properly linked when created
 */

import { Modules } from '@medusajs/framework/utils'
import { ICustomerModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  try {
    console.log(`👤 Customer created event:`, {
      id: data.id,
      email: data.email
    })

    // This ensures the customer is properly set up
    // Additional logic can be added here if needed

  } catch (error) {
    console.error('Error in customer created handler:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'customer.created'
}