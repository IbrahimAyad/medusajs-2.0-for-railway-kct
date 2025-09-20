/**
 * Workflow to Create Customer After Authentication
 * This is the proper Medusa 2.0 way to handle customer creation
 */

import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

const createCustomerStep = createStep(
  "create-customer-step",
  async ({ email }: { email: string }, { container }) => {
    const customerService = container.resolve(Modules.CUSTOMER)

    // Check if customer already exists
    const existingCustomers = await customerService.listCustomers({
      email,
    })

    if (existingCustomers.length > 0) {
      console.log(`✅ Customer already exists for ${email}`)
      return StepResponse.create({
        customer_id: existingCustomers[0].id,
        created: false
      })
    }

    // Create the customer
    const customer = await customerService.createCustomers({
      email,
      has_account: true,
    })

    console.log(`✅ Customer created via workflow: ${customer.id} for ${email}`)

    return StepResponse.create({
      customer_id: customer.id,
      created: true
    }, customer.id) // Pass ID for compensation
  },
  async (customerId: string, { container }) => {
    // Compensation: Delete customer if workflow fails
    if (customerId) {
      const customerService = container.resolve(Modules.CUSTOMER)
      await customerService.deleteCustomers(customerId)
      console.log(`⚠️ Rolled back customer creation: ${customerId}`)
    }
  }
)

const linkAuthToCustomerStep = createStep(
  "link-auth-to-customer-step",
  async ({ authIdentityId, customerId }: { authIdentityId: string, customerId: string }, { container }) => {
    const authService = container.resolve(Modules.AUTH)

    await authService.updateAuthIdentity(authIdentityId, {
      app_metadata: {
        customer_id: customerId
      }
    })

    console.log(`✅ Linked auth identity ${authIdentityId} to customer ${customerId}`)

    return StepResponse.create({ linked: true })
  }
)

export const createCustomerAfterAuthWorkflow = createWorkflow(
  "create-customer-after-auth",
  ({ email, authIdentityId }: { email: string, authIdentityId?: string }) => {
    const customerResult = createCustomerStep({ email })

    if (authIdentityId && customerResult.customer_id) {
      linkAuthToCustomerStep({
        authIdentityId,
        customerId: customerResult.customer_id
      })
    }

    return WorkflowResponse({
      customer_id: customerResult.customer_id,
      created: customerResult.created
    })
  }
)