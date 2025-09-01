import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Individual Customer Group Management
 */

// GET /admin/customer-groups/:id - Get customer group details
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const { include_customers = false } = req.query
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Retrieve group with optional customer list
    const group = await customerModuleService.retrieveCustomerGroup(id, {
      relations: include_customers === 'true' ? ['customers'] : []
    })
    
    if (!group) {
      return res.status(404).json({
        error: "Customer group not found"
      })
    }
    
    // Add statistics
    const enhancedGroup = {
      ...group,
      statistics: {
        customer_count: group.customers?.length || 0,
        created_days_ago: Math.floor(
          (Date.now() - new Date(group.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    }
    
    res.json({
      group: enhancedGroup
    })
    
  } catch (error: any) {
    console.error("[Customer Group Detail] Error:", error)
    
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        error: "Customer group not found"
      })
    }
    
    res.status(500).json({
      error: "Failed to fetch customer group",
      message: error.message
    })
  }
}

// POST /admin/customer-groups/:id - Update customer group
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const updateData = req.body
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Update group
    const updatedGroup = await customerModuleService.updateCustomerGroups(
      id,
      updateData
    )
    
    res.json({
      group: updatedGroup
    })
    
  } catch (error: any) {
    console.error("[Customer Group Update] Error:", error)
    res.status(500).json({
      error: "Failed to update customer group",
      message: error.message
    })
  }
}

// DELETE /admin/customer-groups/:id - Delete customer group
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Delete group
    await customerModuleService.deleteCustomerGroups(id)
    
    res.status(200).json({
      id,
      object: "customer_group",
      deleted: true
    })
    
  } catch (error: any) {
    console.error("[Customer Group Delete] Error:", error)
    res.status(500).json({
      error: "Failed to delete customer group",
      message: error.message
    })
  }
}