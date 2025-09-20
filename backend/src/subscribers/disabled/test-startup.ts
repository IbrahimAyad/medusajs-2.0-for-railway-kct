import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

export default async function testStartupHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('🚀🚀🚀 TEST SUBSCRIBER LOADED AND TRIGGERED!')
  console.log('Event data:', data)
}

export const config: SubscriberConfig = {
  event: 'system.initialized'
}