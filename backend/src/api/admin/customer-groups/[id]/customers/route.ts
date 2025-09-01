import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Manage customers within a group
 */

// POST /admin/customer-groups/:id/customers/batch - Add or remove customers from group
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: groupId } = req.params
    const body = req.body as {
      customer_ids?: string[]
      operation?: string
    }
    
    const {
      customer_ids,
      operation = "add" // "add" or "remove"
    } = body
    
    if (!customer_ids || !Array.isArray(customer_ids)) {
      return res.status(400).json({
        error: "customer_ids array is required"
      })
    }
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Check if group exists
    const group = await customerModuleService.retrieveCustomerGroup(groupId)
    if (!group) {
      return res.status(404).json({
        error: "Customer group not found"
      })
    }
    
    const results = {
      group_id: groupId,
      operation,
      processed: 0,
      failed: 0,
      errors: []
    }
    
    // Process each customer
    for (const customerId of customer_ids) {
      try {
        // Get customer
        const customer = await customerModuleService.retrieveCustomer(customerId)
        if (!customer) {
          results.failed++
          results.errors.push({
            customer_id: customerId,
            error: "Customer not found"
          })
          continue
        }
        
        // Update customer's groups in metadata
        const currentGroups = (customer.metadata?.groups || []) as string[]
        let updatedGroups: string[]
        
        if (operation === "add") {
          // Add group if not already present
          if (!currentGroups.includes(groupId)) {
            updatedGroups = [...currentGroups, groupId]
          } else {
            updatedGroups = currentGroups
          }
        } else if (operation === "remove") {
          // Remove group
          updatedGroups = currentGroups.filter((g: string) => g !== groupId)
        } else {
          results.failed++
          results.errors.push({
            customer_id: customerId,
            error: "Invalid operation"
          })
          continue
        }
        
        // Update customer metadata
        await customerModuleService.updateCustomers(customerId, {
          metadata: {
            ...customer.metadata,
            groups: updatedGroups
          }
        } as any)
        
        results.processed++
        
      } catch (error: any) {
        results.failed++
        results.errors.push({
          customer_id: customerId,
          error: error.message
        })
      }
    }
    
    res.json({
      success: true,
      results
    })
    
  } catch (error: any) {
    console.error("[Customer Group Batch] Error:", error)
    res.status(500).json({
      error: "Failed to update customer group membership",
      message: error.message
    })
  }
}