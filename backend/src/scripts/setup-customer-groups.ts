/**
 * KCT Menswear Customer Group Setup
 * Creates the recommended customer segments with automation rules
 */

import { Modules } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

interface CustomerGroupSetup {
  name: string
  metadata: Record<string, any>
  description?: string
}

const KCT_CUSTOMER_GROUPS: CustomerGroupSetup[] = [
  // Guest Conversion Groups
  {
    name: "Guest Purchasers",
    description: "Customers who completed guest checkout",
    metadata: {
      type: "guest_checkout",
      auto_segment: true,
      conversion_incentive: "10% off when you create an account",
      conversion_target: "New Customer",
      email_series: "guest_to_member",
      tracking_enabled: true,
      expected_conversion_rate: 0.45
    }
  },
  
  // Lifecycle Segments
  {
    name: "New Customer",
    description: "First-time registered customers (0-30 days)",
    metadata: {
      type: "lifecycle",
      auto_segment: true,
      duration_days: 30,
      welcome_discount: 5,
      benefits: ["order_history", "saved_addresses", "wishlist", "size_profile"],
      email_series: "welcome_series",
      next_segment: "Active Customer"
    }
  },
  
  {
    name: "Active Customer",
    description: "Regular customers with 2+ purchases",
    metadata: {
      type: "lifecycle",
      auto_segment: true,
      min_purchases: 2,
      benefits: ["loyalty_points", "birthday_discount", "early_access"],
      loyalty_discount: 5,
      next_segment: "VIP Customer"
    }
  },
  
  {
    name: "VIP Customer",
    description: "High-value customers ($2000+ annual or 5+ purchases)",
    metadata: {
      type: "vip",
      auto_segment: true,
      qualification_rules: {
        annual_spend: 2000,
        min_purchases: 5,
        either_or: true
      },
      benefits: [
        "10% base discount",
        "free_alterations",
        "priority_support",
        "exclusive_collections",
        "personal_stylist"
      ],
      vip_discount: 10,
      free_shipping: true
    }
  },
  
  // Event/Occasion Segments
  {
    name: "Wedding Party",
    description: "Wedding party group bookings",
    metadata: {
      type: "event",
      auto_segment: false,
      group_discount: 15,
      min_party_size: 5,
      benefits: [
        "group_coordinator",
        "bulk_ordering",
        "synchronized_fittings",
        "event_timeline_tracking"
      ],
      coordinator_access: true
    }
  },
  
  {
    name: "Prom Customer",
    description: "Prom and formal event shoppers",
    metadata: {
      type: "seasonal",
      auto_segment: true,
      season: "prom",
      trigger_categories: ["prom", "tuxedos", "formal"],
      benefits: ["style_guide", "group_photos", "rush_alterations"],
      seasonal_discount: 10
    }
  },
  
  {
    name: "Corporate Account",
    description: "B2B and corporate clients",
    metadata: {
      type: "b2b",
      auto_segment: false,
      payment_terms: "net_30",
      volume_discount: 20,
      benefits: [
        "account_manager",
        "bulk_invoicing",
        "custom_catalog",
        "employee_accounts"
      ],
      requires_approval: true
    }
  },
  
  // Re-engagement Segments
  {
    name: "At Risk",
    description: "Customers with no purchase in 90-180 days",
    metadata: {
      type: "re_engagement",
      auto_segment: true,
      days_inactive_min: 90,
      days_inactive_max: 180,
      win_back_discount: 15,
      email_series: "win_back_early",
      risk_level: "medium"
    }
  },
  
  {
    name: "Dormant",
    description: "Customers with no purchase in 180+ days",
    metadata: {
      type: "re_engagement",
      auto_segment: true,
      days_inactive: 180,
      win_back_discount: 20,
      email_series: "win_back_aggressive",
      risk_level: "high",
      last_chance: true
    }
  },
  
  // Specialty Segments
  {
    name: "Big & Tall",
    description: "Customers shopping extended sizes",
    metadata: {
      type: "product_preference",
      auto_segment: true,
      trigger_sizes: ["3XL", "4XL", "5XL", "48", "50", "52", "54"],
      benefits: ["size_guarantee", "extended_catalog", "fit_consultation"],
      specialized_support: true
    }
  },
  
  {
    name: "Measurement Saved",
    description: "Customers with complete measurement profiles",
    metadata: {
      type: "profile_complete",
      auto_segment: true,
      has_measurements: true,
      benefits: ["perfect_fit_guarantee", "virtual_fitting", "alteration_preview"],
      conversion_boost: 0.4
    }
  },
  
  {
    name: "High AOV",
    description: "Customers with average order > $500",
    metadata: {
      type: "value_segment",
      auto_segment: true,
      min_aov: 500,
      benefits: ["premium_support", "exclusive_offers", "concierge_service"],
      expected_ltv: 2500
    }
  }
]

export async function setupCustomerGroups(container: MedusaContainer) {
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  
  console.log("🎯 Setting up KCT Customer Groups...")
  console.log("=" * 50)
  
  const results = {
    created: [],
    existing: [],
    failed: []
  }
  
  for (const groupConfig of KCT_CUSTOMER_GROUPS) {
    try {
      // Check if group already exists
      const [existingGroups] = await customerModuleService.listAndCountCustomerGroups({
        name: groupConfig.name
      })
      
      if (existingGroups.length > 0) {
        console.log(`✓ Group already exists: ${groupConfig.name}`)
        results.existing.push(groupConfig.name)
        continue
      }
      
      // Create the group
      const group = await customerModuleService.createCustomerGroups({
        name: groupConfig.name,
        metadata: {
          ...groupConfig.metadata,
          description: groupConfig.description,
          created_by: "system",
          created_at: new Date().toISOString(),
          kct_segment: true
        }
      })
      
      console.log(`✅ Created group: ${groupConfig.name}`)
      results.created.push(groupConfig.name)
      
    } catch (error) {
      console.error(`❌ Failed to create group: ${groupConfig.name}`, error.message)
      results.failed.push(groupConfig.name)
    }
  }
  
  // Summary
  console.log("\n" + "=" * 50)
  console.log("📊 Customer Group Setup Summary:")
  console.log(`✅ Created: ${results.created.length} groups`)
  console.log(`ℹ️  Existing: ${results.existing.length} groups`)
  console.log(`❌ Failed: ${results.failed.length} groups`)
  
  if (results.created.length > 0) {
    console.log("\n📝 Newly created groups:")
    results.created.forEach(name => console.log(`  - ${name}`))
  }
  
  console.log("\n🎯 Next Steps:")
  console.log("1. Guest conversion flow is ready")
  console.log("2. Segmentation rules are configured")
  console.log("3. Post-purchase hooks will trigger automatically")
  console.log("4. Monitor conversion rates in analytics")
  
  return results
}

// Run if executed directly
if (require.main === module) {
  const dotenv = require("dotenv")
  dotenv.config()
  
  import("@medusajs/framework").then(async ({ initialize }) => {
    const container = await initialize()
    await setupCustomerGroups(container)
    process.exit(0)
  })
}