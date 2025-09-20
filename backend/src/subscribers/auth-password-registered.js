"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
/**
 * Auth Password Registered Subscriber
 * Creates customer record when user registers with email/password
 */

const { Modules } = require("@medusajs/framework/utils");
const { ICustomerModuleService } = require("@medusajs/framework/types");
const { SubscriberArgs, SubscriberConfig } = require("@medusajs/medusa");

async function authPasswordRegisteredHandler({
  event: { data },
  container,
}) {
  const customerModuleService = container.resolve(Modules.CUSTOMER)

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
    const customerData = {
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


exports.default = authPasswordRegisteredHandler;
exports.config = { event: "auth.password.registered" };
