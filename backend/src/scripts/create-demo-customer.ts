import { Modules } from "@medusajs/framework/utils"
import { MedusaContainer } from "@medusajs/framework/types"

/**
 * Create a fully populated demo customer to showcase enhanced features
 */
export async function createDemoCustomer(container: MedusaContainer) {
  const customerModuleService = container.resolve(Modules.CUSTOMER)
  
  try {
    console.log("🎯 Creating KCT VIP Demo Customer...")
    
    // Create the demo customer with full details
    const demoCustomer = await customerModuleService.createCustomers({
      email: "john.smith.vip@kctmenswear.com",
      first_name: "John",
      last_name: "Smith",
      phone: "+1 (555) 123-4567",
      has_account: true,
      company_name: "Smith Enterprises",
      metadata: {
        // Customer analytics (simulated)
        customer_lifetime_value: 15750.00,
        average_order_value: 525.00,
        total_orders: 30,
        order_frequency: 2.5, // orders per month
        days_since_last_order: 7,
        account_age_days: 365,
        risk_score: "low",
        
        // Customer segments
        segments: ["VIP", "Frequent Buyer", "Wedding Party"],
        
        // Customer groups
        groups: ["vip_customers", "wedding_party_2025", "corporate_accounts"],
        
        // Preferences
        preferred_payment_method: "card",
        preferred_shipping_method: "express",
        suit_size: "42R",
        shirt_size: "16.5/34",
        shoe_size: "10.5",
        
        // Wedding/Event details
        wedding_date: "2025-06-15",
        wedding_role: "Groom",
        wedding_party_size: 8,
        wedding_venue: "The Grand Ballroom, NYC",
        
        // Internal notes
        notes: [
          {
            id: "note_1",
            content: "VIP customer - Always provide premium service",
            type: "service",
            created_at: new Date().toISOString(),
            created_by: "admin"
          },
          {
            id: "note_2",
            content: "Wedding on June 15, 2025 - Full wedding party rental",
            type: "event",
            created_at: new Date().toISOString(),
            created_by: "admin"
          },
          {
            id: "note_3",
            content: "Prefers morning appointments, allergic to wool",
            type: "preference",
            created_at: new Date().toISOString(),
            created_by: "admin"
          }
        ],
        
        // Purchase history summary
        purchase_history: {
          last_purchase_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          most_purchased_category: "Suits",
          favorite_brands: ["Hugo Boss", "Calvin Klein", "Ralph Lauren"],
          total_spent_2024: 8500.00,
          total_spent_2025: 7250.00
        },
        
        // Loyalty program
        loyalty_points: 15750,
        loyalty_tier: "Platinum",
        loyalty_member_since: "2024-01-15",
        
        // Marketing preferences
        email_subscribed: true,
        sms_subscribed: true,
        marketing_consent: true,
        communication_preferences: ["email", "sms", "phone"],
        
        // Custom KCT fields
        kct_customer_since: "2024-01-15",
        kct_store_location: "Manhattan",
        kct_sales_associate: "Michael Johnson",
        kct_last_fitting_date: "2025-08-24",
        kct_next_appointment: "2025-09-15 10:00 AM",
        
        // Tags for easy filtering
        tags: [
          "high-value",
          "wedding-2025",
          "suit-buyer",
          "loyal-customer",
          "manhattan-store",
          "platinum-tier"
        ]
      }
    })
    
    // Add addresses
    const addresses = [
      {
        first_name: "John",
        last_name: "Smith",
        address_1: "123 Park Avenue",
        address_2: "Penthouse Suite",
        city: "New York",
        province: "NY",
        postal_code: "10016",
        country_code: "US",
        phone: "+1 (555) 123-4567",
        is_default_shipping: true,
        is_default_billing: true,
        metadata: {
          address_type: "home",
          delivery_instructions: "Doorman building - leave with concierge"
        }
      },
      {
        first_name: "John",
        last_name: "Smith",
        company: "Smith Enterprises",
        address_1: "456 Business Center",
        address_2: "Floor 25",
        city: "New York",
        province: "NY",
        postal_code: "10001",
        country_code: "US",
        phone: "+1 (555) 987-6543",
        metadata: {
          address_type: "office",
          delivery_instructions: "Business hours only (9 AM - 6 PM)"
        }
      }
    ]
    
    // Update customer with addresses
    await customerModuleService.updateCustomers(
      (demoCustomer as any).id,
      { addresses } as any
    )
    
    console.log("✅ Demo customer created successfully!")
    console.log(`   Email: john.smith.vip@kctmenswear.com`)
    console.log(`   ID: ${(demoCustomer as any).id}`)
    console.log("")
    console.log("📊 Customer Stats:")
    console.log(`   • Lifetime Value: $15,750`)
    console.log(`   • Total Orders: 30`)
    console.log(`   • Average Order: $525`)
    console.log(`   • Risk Score: Low`)
    console.log(`   • Loyalty Tier: Platinum`)
    console.log("")
    console.log("🏷️ Segments:")
    console.log(`   • VIP Customer`)
    console.log(`   • Frequent Buyer`)
    console.log(`   • Wedding Party`)
    console.log("")
    console.log("💒 Wedding Details:")
    console.log(`   • Date: June 15, 2025`)
    console.log(`   • Role: Groom`)
    console.log(`   • Party Size: 8`)
    console.log("")
    console.log("📝 Notes:")
    console.log(`   • VIP customer - Always provide premium service`)
    console.log(`   • Wedding on June 15, 2025 - Full wedding party rental`)
    console.log(`   • Prefers morning appointments, allergic to wool`)
    
    return demoCustomer
    
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("ℹ️  Demo customer already exists")
      // Try to retrieve existing customer
      const customers = await customerModuleService.listCustomers({
        email: "john.smith.vip@kctmenswear.com"
      })
      if (customers.length > 0) {
        return customers[0]
      }
    }
    throw error
  }
}

// Run if executed directly
if (require.main === module) {
  require("dotenv").config()
  const { initialize } = require("@medusajs/framework")
  
  ;(async () => {
    const { container } = await initialize()
    await createDemoCustomer(container)
    process.exit(0)
  })()
}