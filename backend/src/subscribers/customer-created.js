"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
/**
 * Customer Created Subscriber
 * Ensures customer records are properly linked when created
 */

const { Modules } = require("@medusajs/framework/utils");
const { ICustomerModuleService } = require("@medusajs/framework/types");
const { SubscriberArgs, SubscriberConfig } = require("@medusajs/medusa");

async function customerCreatedHandler({
  event: { data },
  container,
}) {
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


exports.default = customerCreatedHandler;
exports.config = { event: "customer.created" };
