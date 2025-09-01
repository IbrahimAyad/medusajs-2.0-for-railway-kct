import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Create a fully populated demo customer
 * POST /admin/demo-customer
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const customerModuleService = req.scope.resolve(Modules.CUSTOMER)
    
    console.log("🎯 Creating KCT VIP Demo Customer...")
    
    // Check if demo customer already exists
    const existingCustomers = await customerModuleService.listCustomers({
      email: "john.smith.vip@kctmenswear.com"
    })
    
    if (existingCustomers.length > 0) {
      return res.json({
        message: "Demo customer already exists",
        customer: existingCustomers[0]
      })
    }
    
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
        segments: ["VIP", "Frequent Buyer", "Wedding Party", "Platinum Tier"],
        
        // Customer groups
        groups: ["vip_customers", "wedding_party_2025", "corporate_accounts"],
        
        // Measurements & Preferences
        measurements: {
          suit_size: "42R",
          suit_chest: "42",
          suit_waist: "36",
          suit_inseam: "32",
          shirt_size: "16.5/34",
          shirt_neck: "16.5",
          shirt_sleeve: "34",
          shoe_size: "10.5",
          shoe_width: "D",
          preferred_fit: "Classic Fit",
          alterations_needed: "Sleeve length -0.5 inch"
        },
        
        // Wedding/Event details
        events: {
          wedding: {
            date: "2025-06-15",
            role: "Groom",
            party_size: 8,
            venue: "The Grand Ballroom, NYC",
            color_scheme: "Navy & Gold",
            groomsmen: [
              "Mike Johnson (Best Man)",
              "David Smith (Brother)",
              "Tom Wilson",
              "James Brown",
              "Robert Davis",
              "William Taylor",
              "Charles Anderson"
            ],
            rental_items: [
              "8x Navy Blue Tuxedos",
              "8x Gold Bow Ties",
              "8x Gold Cummerbunds",
              "8x White Dress Shirts",
              "8x Black Patent Leather Shoes"
            ],
            total_rental_value: 4200.00,
            deposit_paid: 1000.00,
            balance_due: 3200.00
          }
        },
        
        // Internal notes
        notes: [
          {
            id: "note_1",
            content: "🌟 VIP CUSTOMER - Always provide premium service. Has been with us since 2024.",
            type: "service",
            priority: "high",
            created_at: new Date().toISOString(),
            created_by: "admin"
          },
          {
            id: "note_2",
            content: "💒 WEDDING: June 15, 2025 - Full wedding party rental (8 tuxedos). Groom role.",
            type: "event",
            priority: "high",
            created_at: new Date().toISOString(),
            created_by: "admin"
          },
          {
            id: "note_3",
            content: "📋 PREFERENCES: Prefers morning appointments (before 11 AM). Allergic to wool - use cotton/synthetic blends only.",
            type: "preference",
            priority: "medium",
            created_at: new Date().toISOString(),
            created_by: "admin"
          },
          {
            id: "note_4",
            content: "🎯 SALES: Interested in new Tom Ford collection. Follow up after wedding for fall wardrobe update.",
            type: "sales",
            priority: "medium",
            created_at: new Date().toISOString(),
            created_by: "sales_team"
          }
        ],
        
        // Purchase history summary
        purchase_history: {
          last_purchase: {
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            items: ["Hugo Boss Navy Suit", "White Dress Shirt", "Silk Tie"],
            amount: 875.00
          },
          most_purchased: {
            category: "Suits",
            brands: ["Hugo Boss", "Calvin Klein", "Ralph Lauren"],
            average_price: 525.00
          },
          yearly_spending: {
            "2024": 8500.00,
            "2025": 7250.00,
            "total": 15750.00
          },
          favorite_products: [
            "Hugo Boss Classic Navy Suit",
            "Calvin Klein Slim Fit Tuxedo",
            "Ralph Lauren Oxford Shirts"
          ]
        },
        
        // Loyalty program
        loyalty: {
          points: 15750,
          tier: "Platinum",
          member_since: "2024-01-15",
          benefits: [
            "20% discount on all purchases",
            "Free alterations",
            "Priority appointments",
            "Exclusive event invitations",
            "Personal stylist service"
          ],
          next_tier: "Diamond (at $20,000)",
          points_to_next_tier: 4250
        },
        
        // Marketing & Communication
        marketing: {
          email_subscribed: true,
          sms_subscribed: true,
          push_notifications: true,
          marketing_consent: true,
          consent_date: "2024-01-15",
          communication_preferences: ["email", "sms", "phone"],
          interests: ["New Arrivals", "Sales", "Wedding Collections", "Seasonal Collections"],
          last_email_opened: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          email_engagement_rate: "78%"
        },
        
        // Custom KCT fields
        kct: {
          customer_number: "KCT-2024-0042",
          customer_since: "2024-01-15",
          store_location: "Manhattan Flagship",
          preferred_store: "Manhattan",
          sales_associate: "Michael Johnson",
          stylist: "Sarah Williams",
          last_visit: "2025-08-24",
          last_fitting: "2025-08-24",
          next_appointment: {
            date: "2025-09-15",
            time: "10:00 AM",
            type: "Final Wedding Fitting",
            location: "Manhattan Store",
            with: "Michael Johnson"
          },
          referral_source: "Friend Referral",
          referred_by: "Robert Thompson",
          referrals_made: 3,
          special_occasions: [
            "Wedding: June 15, 2025",
            "Birthday: March 22",
            "Anniversary: October 10"
          ]
        },
        
        // Tags for filtering and segmentation
        tags: [
          "vip-customer",
          "platinum-tier",
          "high-value",
          "wedding-2025-june",
          "groom",
          "manhattan-store",
          "loyal-customer",
          "frequent-buyer",
          "suit-buyer",
          "hugo-boss-fan",
          "morning-appointments",
          "wool-allergy",
          "referral-source"
        ],
        
        // Calculated scores and ratings
        scores: {
          lifetime_value_score: 95, // out of 100
          loyalty_score: 92,
          engagement_score: 78,
          risk_score: 15, // lower is better
          satisfaction_score: 98,
          referral_score: 85
        }
      }
    })
    
    // Add comprehensive addresses
    const addresses = [
      {
        first_name: "John",
        last_name: "Smith",
        address_1: "123 Park Avenue",
        address_2: "Penthouse Suite A",
        city: "New York",
        province: "NY",
        postal_code: "10016",
        country_code: "US",
        phone: "+1 (555) 123-4567",
        is_default_shipping: true,
        is_default_billing: true,
        metadata: {
          type: "residential",
          label: "Home - Manhattan",
          delivery_instructions: "Doorman building - leave with concierge",
          verified: true,
          coordinates: {
            lat: 40.7489,
            lng: -73.9680
          }
        }
      },
      {
        first_name: "John",
        last_name: "Smith",
        company: "Smith Enterprises",
        address_1: "456 Business Center",
        address_2: "Floor 25, Suite 2500",
        city: "New York",
        province: "NY",
        postal_code: "10001",
        country_code: "US",
        phone: "+1 (555) 987-6543",
        metadata: {
          type: "commercial",
          label: "Office - Midtown",
          delivery_instructions: "Reception desk - Business hours only (9 AM - 6 PM)",
          verified: true,
          coordinates: {
            lat: 40.7505,
            lng: -73.9934
          }
        }
      }
    ]
    
    // Update customer with addresses
    try {
      await customerModuleService.updateCustomers(
        (demoCustomer as any).id,
        { addresses } as any
      )
    } catch (error) {
      console.log("Note: Could not add addresses in this version")
    }
    
    res.status(201).json({
      success: true,
      message: "Demo customer created successfully!",
      customer: demoCustomer,
      details: {
        email: "john.smith.vip@kctmenswear.com",
        customer_id: (demoCustomer as any).id,
        features_included: [
          "Full contact information",
          "Customer analytics (CLV: $15,750, AOV: $525)",
          "30 order history",
          "VIP & Wedding Party segments",
          "Platinum loyalty tier (15,750 points)",
          "Wedding event details (June 15, 2025)",
          "8 groomsmen details",
          "Full measurements",
          "4 internal notes",
          "2 addresses",
          "Purchase history",
          "Marketing preferences",
          "Custom KCT fields",
          "Calculated scores"
        ],
        api_endpoints: {
          view_basic: `/admin/customers/${(demoCustomer as any).id}`,
          view_enhanced: `/admin/customers-enhanced/${(demoCustomer as any).id}?include_analytics=true`,
          view_orders: `/admin/customers-enhanced/${(demoCustomer as any).id}?include_orders=true`
        }
      }
    })
    
  } catch (error: any) {
    console.error("[Demo Customer Creation] Error:", error)
    res.status(500).json({
      error: "Failed to create demo customer",
      message: error.message
    })
  }
}