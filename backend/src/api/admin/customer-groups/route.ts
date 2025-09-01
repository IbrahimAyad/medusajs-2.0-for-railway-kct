import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Customer Group Management Routes
 * Manage customer segments and groups for targeted marketing and pricing
 */

// GET /admin/customer-groups - List all customer groups
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { 
      q,
      limit = 50,
      offset = 0,
      include_customer_count = false
    } = req.query
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Build filters for search
    const filters: any = {}
    if (q) {
      filters.$or = [
        { name: { $ilike: `%${q}%` } }
      ]
    }
    
    // List customer groups
    const [groups, count] = await customerModuleService.listAndCountCustomerGroups(
      filters,
      {
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        relations: include_customer_count === 'true' ? ['customers'] : []
      }
    )
    
    // Enhance groups with customer counts if requested
    let enhancedGroups = groups
    if (include_customer_count === 'true') {
      enhancedGroups = groups.map((group: any) => ({
        ...group,
        customer_count: group.customers?.length || 0,
        customers: undefined // Remove full customer list from response
      }))
    }
    
    res.json({
      groups: enhancedGroups,
      count,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string)
    })
    
  } catch (error: any) {
    console.error("[Customer Groups List] Error:", error)
    res.status(500).json({
      error: "Failed to list customer groups",
      message: error.message
    })
  }
}

// POST /admin/customer-groups - Create a new customer group
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const body = req.body as {
      name?: string
      metadata?: Record<string, any>
      customer_ids?: string[]
    }
    
    const {
      name,
      metadata,
      customer_ids = []
    } = body
    
    if (!name) {
      return res.status(400).json({
        error: "Group name is required"
      })
    }
    
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Create the group
    const groupData: any = {
      name,
      metadata: metadata || {}
    }
    
    // Add group metadata for KCT specific segments
    const kctSegments = [
      'VIP',
      'Wedding Party',
      'Prom Customer',
      'Corporate Account',
      'Frequent Buyer',
      'New Customer',
      'Inactive',
      'High Value',
      'Discount Eligible'
    ]
    
    if (kctSegments.includes(name)) {
      groupData.metadata = {
        ...groupData.metadata,
        is_kct_segment: true,
        segment_type: name.toLowerCase().replace(' ', '_')
      }
    }
    
    const group = await customerModuleService.createCustomerGroups(groupData)
    
    // Add customers to group if provided
    if (customer_ids.length > 0) {
      try {
        // In Medusa 2.10.1, use addCustomerToGroup for each customer
        for (const customerId of customer_ids) {
          await customerModuleService.addCustomerToGroup({
            customer_id: customerId,
            customer_group_id: (group as any).id
          })
        }
      } catch (error) {
        console.log("Note: Adding customers to group:", error)
      }
    }
    
    res.status(201).json({
      group
    })
    
  } catch (error: any) {
    console.error("[Customer Group Create] Error:", error)
    
    if (error.message?.includes("already exists")) {
      return res.status(409).json({
        error: "Customer group already exists"
      })
    }
    
    res.status(500).json({
      error: "Failed to create customer group",
      message: error.message
    })
  }
}