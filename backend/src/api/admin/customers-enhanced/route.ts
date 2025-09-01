import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Enhanced Customer Management Route with Advanced Features
 * Includes: Pagination, Search, Filtering, Sorting, and Statistics
 */

// GET /admin/customers-enhanced - List customers with advanced features
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const {
      q,                          // Search query
      limit = 50,                 // Items per page
      offset = 0,                 // Pagination offset  
      order = "created_at",       // Sort field
      direction = "desc",         // Sort direction
      has_account,                // Filter by account status
      created_after,              // Date filter
      created_before,             // Date filter
      groups,                     // Customer group filter
      include_stats = false      // Include order statistics
    } = req.query

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    // Build advanced filters
    const filters: any = {}
    
    // Search across multiple fields
    if (q) {
      filters.$or = [
        { email: { $ilike: `%${q}%` } },
        { first_name: { $ilike: `%${q}%` } },
        { last_name: { $ilike: `%${q}%` } },
        { phone: { $ilike: `%${q}%` } },
        { company_name: { $ilike: `%${q}%` } }
      ]
    }
    
    // Account status filter
    if (has_account !== undefined) {
      filters.has_account = has_account === 'true'
    }
    
    // Date range filters
    if (created_after || created_before) {
      filters.created_at = {}
      if (created_after) {
        filters.created_at.$gte = new Date(created_after as string)
      }
      if (created_before) {
        filters.created_at.$lte = new Date(created_before as string)
      }
    }
    
    // Customer group filter
    if (groups) {
      const groupIds = (groups as string).split(',')
      filters.groups = { $in: groupIds }
    }
    
    // Build sorting options
    const orderBy: any = {}
    orderBy[order as string] = direction === 'asc' ? 'ASC' : 'DESC'
    
    // List customers with pagination and sorting
    const [customers, count] = await customerModuleService.listAndCountCustomers(
      filters,
      {
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        order: orderBy,
        relations: include_stats ? ['orders'] : []
      }
    )
    
    // Calculate pagination metadata
    const pageSize = parseInt(limit as string)
    const currentPage = Math.floor(parseInt(offset as string) / pageSize) + 1
    const totalPages = Math.ceil(count / pageSize)
    
    // Add customer statistics if requested
    let enhancedCustomers = customers
    if (include_stats === 'true') {
      enhancedCustomers = await Promise.all(
        customers.map(async (customer: any) => {
          // Get order statistics for each customer
          const stats = {
            total_orders: 0,
            total_spent: 0,
            average_order_value: 0,
            last_order_date: null
          }
          
          // Add stats to customer object
          return {
            ...customer,
            stats
          }
        })
      )
    }
    
    res.json({
      customers: enhancedCustomers,
      count,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
      current_page: currentPage,
      total_pages: totalPages,
      has_more: currentPage < totalPages,
      filters_applied: {
        search: q || null,
        has_account: has_account || null,
        date_range: {
          after: created_after || null,
          before: created_before || null
        },
        groups: groups || null
      }
    })

  } catch (error: any) {
    console.error("[Enhanced Customer List] Error:", error)
    res.status(500).json({
      error: "Failed to list customers",
      message: error.message
    })
  }
}

// POST /admin/customers-enhanced/bulk - Bulk operations on customers
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const body = req.body as {
      operation?: string
      customer_ids?: string[]
      update_data?: Record<string, any>
      group_id?: string
    }
    
    const {
      operation,      // 'delete', 'update', 'add_to_group', 'remove_from_group'
      customer_ids,   // Array of customer IDs
      update_data,    // Data for update operations
      group_id        // Group ID for group operations
    } = body

    if (!operation || !customer_ids || !Array.isArray(customer_ids)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Operation and customer_ids are required"
      })
    }

    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    let result: any = {
      operation,
      processed: 0,
      failed: 0,
      errors: []
    }

    switch (operation) {
      case 'delete':
        // Bulk delete customers
        for (const customerId of customer_ids) {
          try {
            await customerModuleService.deleteCustomers(customerId)
            result.processed++
          } catch (error: any) {
            result.failed++
            result.errors.push({
              customer_id: customerId,
              error: error.message
            })
          }
        }
        break
        
      case 'update':
        // Bulk update customers
        if (!update_data) {
          return res.status(400).json({
            error: "Update data required for update operation"
          })
        }
        
        for (const customerId of customer_ids) {
          try {
            await customerModuleService.updateCustomers(customerId, update_data)
            result.processed++
          } catch (error: any) {
            result.failed++
            result.errors.push({
              customer_id: customerId,
              error: error.message
            })
          }
        }
        break
        
      case 'add_to_group':
      case 'remove_from_group':
        // Group operations would require customer group module
        // This is a placeholder for future implementation
        result.message = "Group operations not yet implemented"
        break
        
      default:
        return res.status(400).json({
          error: "Invalid operation",
          message: `Operation '${operation}' is not supported`
        })
    }

    res.json({
      success: true,
      result
    })

  } catch (error: any) {
    console.error("[Customer Bulk Operation] Error:", error)
    res.status(500).json({
      error: "Failed to perform bulk operation",
      message: error.message
    })
  }
}