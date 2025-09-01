/**
 * Setup Customer Groups Endpoint
 * Creates all KCT customer groups in the database
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const KCT_CUSTOMER_GROUPS = [
  {
    id: 'cg_guest_purchasers',
    name: 'Guest Purchasers',
    metadata: {
      type: 'guest_checkout',
      description: 'Customers who completed guest checkout',
      auto_segment: true,
      conversion_incentive: '10% off when you create an account',
      conversion_target: 'New Customer',
      email_series: 'guest_to_member',
      tracking_enabled: true,
      expected_conversion_rate: 0.45,
      kct_segment: true
    }
  },
  {
    id: 'cg_new_customer',
    name: 'New Customer',
    metadata: {
      type: 'lifecycle',
      description: 'First-time registered customers (0-30 days)',
      auto_segment: true,
      duration_days: 30,
      welcome_discount: 5,
      benefits: ['order_history', 'saved_addresses', 'wishlist', 'size_profile'],
      email_series: 'welcome_series',
      next_segment: 'Active Customer',
      kct_segment: true
    }
  },
  {
    id: 'cg_active_customer',
    name: 'Active Customer',
    metadata: {
      type: 'lifecycle',
      description: 'Regular customers with 2+ purchases',
      auto_segment: true,
      min_purchases: 2,
      benefits: ['loyalty_points', 'birthday_discount', 'early_access'],
      loyalty_discount: 5,
      next_segment: 'VIP Customer',
      kct_segment: true
    }
  },
  {
    id: 'cg_vip_customer',
    name: 'VIP Customer',
    metadata: {
      type: 'vip',
      description: 'High-value customers ($2000+ annual or 5+ purchases)',
      auto_segment: true,
      qualification_rules: {
        annual_spend: 2000,
        min_purchases: 5,
        either_or: true
      },
      benefits: [
        '10% base discount',
        'free_alterations',
        'priority_support',
        'exclusive_collections',
        'personal_stylist'
      ],
      vip_discount: 10,
      free_shipping: true,
      kct_segment: true
    }
  },
  {
    id: 'cg_wedding_party',
    name: 'Wedding Party',
    metadata: {
      type: 'event',
      description: 'Wedding party group bookings',
      auto_segment: false,
      group_discount: 15,
      min_party_size: 5,
      benefits: [
        'group_coordinator',
        'bulk_ordering',
        'synchronized_fittings',
        'event_timeline_tracking'
      ],
      coordinator_access: true,
      kct_segment: true
    }
  },
  {
    id: 'cg_prom_customer',
    name: 'Prom Customer',
    metadata: {
      type: 'seasonal',
      description: 'Prom and formal event shoppers',
      auto_segment: true,
      season: 'prom',
      trigger_categories: ['prom', 'tuxedos', 'formal'],
      benefits: ['style_guide', 'group_photos', 'rush_alterations'],
      seasonal_discount: 10,
      kct_segment: true
    }
  },
  {
    id: 'cg_corporate',
    name: 'Corporate Account',
    metadata: {
      type: 'b2b',
      description: 'B2B and corporate clients',
      auto_segment: false,
      payment_terms: 'net_30',
      volume_discount: 20,
      benefits: [
        'account_manager',
        'bulk_invoicing',
        'custom_catalog',
        'employee_accounts'
      ],
      requires_approval: true,
      kct_segment: true
    }
  },
  {
    id: 'cg_at_risk',
    name: 'At Risk',
    metadata: {
      type: 're_engagement',
      description: 'Customers with no purchase in 90-180 days',
      auto_segment: true,
      days_inactive_min: 90,
      days_inactive_max: 180,
      win_back_discount: 15,
      email_series: 'win_back_early',
      risk_level: 'medium',
      kct_segment: true
    }
  },
  {
    id: 'cg_dormant',
    name: 'Dormant',
    metadata: {
      type: 're_engagement',
      description: 'Customers with no purchase in 180+ days',
      auto_segment: true,
      days_inactive: 180,
      win_back_discount: 20,
      email_series: 'win_back_aggressive',
      risk_level: 'high',
      last_chance: true,
      kct_segment: true
    }
  },
  {
    id: 'cg_big_tall',
    name: 'Big & Tall',
    metadata: {
      type: 'product_preference',
      description: 'Customers shopping extended sizes',
      auto_segment: true,
      trigger_sizes: ['3XL', '4XL', '5XL', '48', '50', '52', '54'],
      benefits: ['size_guarantee', 'extended_catalog', 'fit_consultation'],
      specialized_support: true,
      kct_segment: true
    }
  },
  {
    id: 'cg_measurement_saved',
    name: 'Measurement Saved',
    metadata: {
      type: 'profile_complete',
      description: 'Customers with complete measurement profiles',
      auto_segment: true,
      has_measurements: true,
      benefits: ['perfect_fit_guarantee', 'virtual_fitting', 'alteration_preview'],
      conversion_boost: 0.4,
      kct_segment: true
    }
  },
  {
    id: 'cg_high_aov',
    name: 'High AOV',
    metadata: {
      type: 'value_segment',
      description: 'Customers with average order > $500',
      auto_segment: true,
      min_aov: 500,
      benefits: ['premium_support', 'exclusive_offers', 'concierge_service'],
      expected_ltv: 2500,
      kct_segment: true
    }
  }
]

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    const results = {
      created: [] as string[],
      existing: [] as string[],
      failed: [] as string[],
      total: KCT_CUSTOMER_GROUPS.length
    }
    
    for (const groupConfig of KCT_CUSTOMER_GROUPS) {
      try {
        // Check if group already exists
        const [existingGroups] = await customerModuleService.listAndCountCustomerGroups({
          name: groupConfig.name
        })
        
        if (existingGroups.length > 0) {
          results.existing.push(groupConfig.name)
          continue
        }
        
        // Create the group
        await customerModuleService.createCustomerGroups({
          name: groupConfig.name,
          metadata: groupConfig.metadata
        })
        
        results.created.push(groupConfig.name)
        
      } catch (error: any) {
        console.error(`Failed to create group: ${groupConfig.name}`, error.message)
        results.failed.push(groupConfig.name)
      }
    }
    
    res.json({
      success: true,
      message: "Customer groups setup completed",
      results,
      summary: {
        total_groups: results.total,
        created: results.created.length,
        already_existed: results.existing.length,
        failed: results.failed.length
      }
    })
    
  } catch (error: any) {
    console.error("[Customer Groups Setup] Error:", error)
    res.status(500).json({
      error: "Failed to setup customer groups",
      message: error.message
    })
  }
}

// GET endpoint to check current groups
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    const [groups, count] = await customerModuleService.listAndCountCustomerGroups(
      {},
      { relations: ['customers'] }
    )
    
    const groupSummary = groups.map((group: any) => ({
      id: group.id,
      name: group.name,
      customer_count: group.customers?.length || 0,
      type: group.metadata?.type || 'manual',
      auto_segment: group.metadata?.auto_segment || false,
      description: group.metadata?.description || '',
      benefits: group.metadata?.benefits || [],
      discount: group.metadata?.vip_discount || 
                group.metadata?.loyalty_discount || 
                group.metadata?.welcome_discount ||
                group.metadata?.group_discount ||
                group.metadata?.volume_discount ||
                group.metadata?.seasonal_discount ||
                group.metadata?.win_back_discount || 0
    }))
    
    res.json({
      success: true,
      total_groups: count,
      groups: groupSummary,
      kct_configured: groupSummary.some(g => g.name.includes('VIP') || g.name.includes('Wedding'))
    })
    
  } catch (error: any) {
    console.error("[Customer Groups Check] Error:", error)
    res.status(500).json({
      error: "Failed to check customer groups",
      message: error.message
    })
  }
}