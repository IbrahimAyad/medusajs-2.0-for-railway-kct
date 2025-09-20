"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
/**
 * Auth Identity Created Subscriber
 * Automatically creates customer records when auth identities are created
 */

const { Modules } = require("@medusajs/framework/utils");
const { ICustomerModuleService } = require("@medusajs/framework/types");
const { SubscriberArgs, SubscriberConfig } = require("@medusajs/medusa");

async function authIdentityCreatedHandler({
  event: { data },
  container,
}) {
  console.log('🔥🔥🔥 AUTH IDENTITY CREATED SUBSCRIBER LOADED!')
  const customerModuleService = container.resolve(Modules.CUSTOMER)

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
    const customerData = {
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


exports.default = authIdentityCreatedHandler;
exports.config = { event: "auth.identity_created" };
