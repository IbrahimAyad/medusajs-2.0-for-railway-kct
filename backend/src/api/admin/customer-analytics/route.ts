/**
 * Customer Analytics & Segmentation Dashboard
 * Provides insights into customer groups and conversion metrics
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    // Get all customer groups with counts
    const [groups] = await customerModuleService.listAndCountCustomerGroups(
      {},
      { relations: ['customers'] }
    )
    
    // Process group analytics
    const groupAnalytics = await Promise.all(groups.map(async (group: any) => {
      const metadata = group.metadata || {}
      const customerCount = group.customers?.length || 0
      
      // Calculate group-specific metrics
      let metrics: any = {
        customer_count: customerCount,
        growth_rate: 0,
        conversion_rate: 0,
        avg_order_value: 0,
        total_revenue: 0
      }
      
      // Special handling for Guest Purchasers group
      if (group.name === "Guest Purchasers") {
        const guestTracking = metadata.guest_tracking || []
        const converted = guestTracking.filter(g => g.conversion_status === 'converted').length
        
        metrics = {
          ...metrics,
          total_guests: guestTracking.length,
          converted_count: converted,
          conversion_rate: guestTracking.length > 0 
            ? Math.round((converted / guestTracking.length) * 100) 
            : 0,
          pending_conversions: guestTracking.filter(g => g.conversion_status === 'pending').length,
          total_guest_revenue: guestTracking.reduce((sum, g) => sum + (g.order_total || 0), 0)
        }
      }
      
      // Calculate revenue for registered customer groups
      if (customerCount > 0 && group.name !== "Guest Purchasers") {
        const customerIds = group.customers.map(c => c.id)
        const [orders] = await orderModuleService.listAndCountOrders({
          customer_id: customerIds
        })
        
        metrics.total_revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)
        metrics.avg_order_value = orders.length > 0 
          ? Math.round(metrics.total_revenue / orders.length) 
          : 0
        metrics.total_orders = orders.length
      }
      
      return {
        id: group.id,
        name: group.name,
        description: metadata.description || '',
        type: metadata.type || 'manual',
        auto_segment: metadata.auto_segment || false,
        benefits: metadata.benefits || [],
        metrics,
        metadata
      }
    }))
    
    // Calculate overall analytics
    const [allCustomers, totalCustomerCount] = await customerModuleService.listAndCountCustomers({})
    const [allOrders, totalOrderCount] = await orderModuleService.listAndCountOrders({})
    
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const guestGroup = groupAnalytics.find(g => g.name === "Guest Purchasers")
    
    const overallMetrics = {
      total_customers: totalCustomerCount,
      total_orders: totalOrderCount,
      total_revenue: totalRevenue,
      avg_order_value: totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount) : 0,
      guest_conversion_rate: guestGroup?.metrics.conversion_rate || 0,
      total_groups: groups.length,
      automated_groups: groupAnalytics.filter(g => g.auto_segment).length,
      
      // Segment distribution
      segment_distribution: {
        new_customers: groupAnalytics.find(g => g.name === "New Customer")?.metrics.customer_count || 0,
        active_customers: groupAnalytics.find(g => g.name === "Active Customer")?.metrics.customer_count || 0,
        vip_customers: groupAnalytics.find(g => g.name === "VIP Customer")?.metrics.customer_count || 0,
        at_risk: groupAnalytics.find(g => g.name === "At Risk")?.metrics.customer_count || 0,
        dormant: groupAnalytics.find(g => g.name === "Dormant")?.metrics.customer_count || 0
      },
      
      // Conversion funnel
      conversion_funnel: {
        guests: guestGroup?.metrics.total_guests || 0,
        registered: totalCustomerCount,
        active: groupAnalytics.find(g => g.name === "Active Customer")?.metrics.customer_count || 0,
        vip: groupAnalytics.find(g => g.name === "VIP Customer")?.metrics.customer_count || 0
      }
    }
    
    // Recommendations based on data
    const recommendations = generateRecommendations(overallMetrics, groupAnalytics)
    
    res.json({
      success: true,
      analytics: {
        overview: overallMetrics,
        groups: groupAnalytics,
        recommendations
      }
    })
    
  } catch (error: any) {
    console.error("[Customer Analytics] Error:", error)
    res.status(500).json({
      error: "Failed to fetch customer analytics",
      message: error.message
    })
  }
}

/**
 * Generate actionable recommendations based on analytics
 */
function generateRecommendations(metrics: any, groups: any[]): any[] {
  const recommendations = []
  
  // Guest conversion recommendations
  const guestGroup = groups.find(g => g.name === "Guest Purchasers")
  if (guestGroup) {
    const conversionRate = guestGroup.metrics.conversion_rate || 0
    
    if (conversionRate < 30) {
      recommendations.push({
        priority: "high",
        type: "conversion",
        title: "Improve Guest Conversion",
        description: `Your guest conversion rate is ${conversionRate}%. Industry average is 40-50%.`,
        action: "Consider increasing the welcome discount or simplifying account creation",
        potential_impact: "Could add $" + Math.round(guestGroup.metrics.total_guest_revenue * 0.2) + " in revenue"
      })
    }
    
    if (guestGroup.metrics.pending_conversions > 10) {
      recommendations.push({
        priority: "medium",
        type: "conversion",
        title: "Pending Guest Conversions",
        description: `You have ${guestGroup.metrics.pending_conversions} guests who haven't converted yet`,
        action: "Send targeted email campaign with personalized offers",
        potential_impact: `${Math.round(guestGroup.metrics.pending_conversions * 0.4)} potential new members`
      })
    }
  }
  
  // Re-engagement recommendations
  const atRiskGroup = groups.find(g => g.name === "At Risk")
  const dormantGroup = groups.find(g => g.name === "Dormant")
  
  if (atRiskGroup && atRiskGroup.metrics.customer_count > 20) {
    recommendations.push({
      priority: "high",
      type: "retention",
      title: "At-Risk Customers Need Attention",
      description: `${atRiskGroup.metrics.customer_count} customers haven't purchased in 90-180 days`,
      action: "Launch win-back campaign with 15% discount",
      potential_impact: "Prevent $" + Math.round(atRiskGroup.metrics.total_revenue * 0.3) + " in lost revenue"
    })
  }
  
  if (dormantGroup && dormantGroup.metrics.customer_count > 50) {
    recommendations.push({
      priority: "medium",
      type: "retention",
      title: "Reactivate Dormant Customers",
      description: `${dormantGroup.metrics.customer_count} customers are dormant (180+ days)`,
      action: "Send 'We miss you' campaign with 20% discount",
      potential_impact: "Could recover " + Math.round(dormantGroup.metrics.customer_count * 0.1) + " customers"
    })
  }
  
  // VIP growth recommendations
  const vipGroup = groups.find(g => g.name === "VIP Customer")
  const activeGroup = groups.find(g => g.name === "Active Customer")
  
  if (activeGroup && vipGroup) {
    const vipRatio = vipGroup.metrics.customer_count / (metrics.total_customers || 1)
    if (vipRatio < 0.05) {
      recommendations.push({
        priority: "medium",
        type: "growth",
        title: "Grow VIP Segment",
        description: `Only ${Math.round(vipRatio * 100)}% of customers are VIP. Target is 5-10%.`,
        action: "Create VIP upgrade campaign for active customers",
        potential_impact: "Increase customer LTV by 40%"
      })
    }
  }
  
  // Seasonal recommendations
  const currentMonth = new Date().getMonth()
  if (currentMonth >= 2 && currentMonth <= 5) {
    recommendations.push({
      priority: "high",
      type: "seasonal",
      title: "Prom Season Opportunity",
      description: "Prom season is active (March-June)",
      action: "Promote group bookings and early bird discounts",
      potential_impact: "Prom typically drives 25% of annual formal wear revenue"
    })
  }
  
  if (currentMonth >= 8 && currentMonth <= 11) {
    recommendations.push({
      priority: "high",
      type: "seasonal",
      title: "Wedding Season Marketing",
      description: "Peak wedding season approaching",
      action: "Target wedding party groups with bulk discounts",
      potential_impact: "Wedding parties average $3,000-5,000 per event"
    })
  }
  
  return recommendations
}