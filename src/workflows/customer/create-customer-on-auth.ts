/**
 * Workflow to create customer when auth identity is created
 * This ensures customers are properly linked to auth identities
 */

import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createCustomersStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

export type CreateCustomerOnAuthInput = {
  email: string
  authIdentityId: string
}

export const createCustomerOnAuthWorkflow = createWorkflow(
  "create-customer-on-auth",
  (input: CreateCustomerOnAuthInput) => {
    console.log(`🔄 WORKFLOW: Creating customer for auth identity ${input.authIdentityId}`)

    // Create customer with email
    const customer = createCustomersStep({
      email: input.email,
    })

    console.log(`✅ WORKFLOW: Customer created successfully`)

    return new WorkflowResponse(customer)
  }
)