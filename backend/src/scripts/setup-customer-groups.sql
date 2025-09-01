-- KCT Menswear Customer Groups Setup
-- Run this script to create all customer segments with automation rules

-- Guest Purchasers Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_guest_purchasers',
  'Guest Purchasers',
  '{
    "type": "guest_checkout",
    "description": "Customers who completed guest checkout",
    "auto_segment": true,
    "conversion_incentive": "10% off when you create an account",
    "conversion_target": "New Customer",
    "email_series": "guest_to_member",
    "tracking_enabled": true,
    "expected_conversion_rate": 0.45,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- New Customer Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_new_customer',
  'New Customer',
  '{
    "type": "lifecycle",
    "description": "First-time registered customers (0-30 days)",
    "auto_segment": true,
    "duration_days": 30,
    "welcome_discount": 5,
    "benefits": ["order_history", "saved_addresses", "wishlist", "size_profile"],
    "email_series": "welcome_series",
    "next_segment": "Active Customer",
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Active Customer Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_active_customer',
  'Active Customer',
  '{
    "type": "lifecycle",
    "description": "Regular customers with 2+ purchases",
    "auto_segment": true,
    "min_purchases": 2,
    "benefits": ["loyalty_points", "birthday_discount", "early_access"],
    "loyalty_discount": 5,
    "next_segment": "VIP Customer",
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- VIP Customer Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_vip_customer',
  'VIP Customer',
  '{
    "type": "vip",
    "description": "High-value customers ($2000+ annual or 5+ purchases)",
    "auto_segment": true,
    "qualification_rules": {
      "annual_spend": 2000,
      "min_purchases": 5,
      "either_or": true
    },
    "benefits": [
      "10% base discount",
      "free_alterations",
      "priority_support",
      "exclusive_collections",
      "personal_stylist"
    ],
    "vip_discount": 10,
    "free_shipping": true,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Wedding Party Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_wedding_party',
  'Wedding Party',
  '{
    "type": "event",
    "description": "Wedding party group bookings",
    "auto_segment": false,
    "group_discount": 15,
    "min_party_size": 5,
    "benefits": [
      "group_coordinator",
      "bulk_ordering",
      "synchronized_fittings",
      "event_timeline_tracking"
    ],
    "coordinator_access": true,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Prom Customer Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_prom_customer',
  'Prom Customer',
  '{
    "type": "seasonal",
    "description": "Prom and formal event shoppers",
    "auto_segment": true,
    "season": "prom",
    "trigger_categories": ["prom", "tuxedos", "formal"],
    "benefits": ["style_guide", "group_photos", "rush_alterations"],
    "seasonal_discount": 10,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Corporate Account Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_corporate',
  'Corporate Account',
  '{
    "type": "b2b",
    "description": "B2B and corporate clients",
    "auto_segment": false,
    "payment_terms": "net_30",
    "volume_discount": 20,
    "benefits": [
      "account_manager",
      "bulk_invoicing",
      "custom_catalog",
      "employee_accounts"
    ],
    "requires_approval": true,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- At Risk Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_at_risk',
  'At Risk',
  '{
    "type": "re_engagement",
    "description": "Customers with no purchase in 90-180 days",
    "auto_segment": true,
    "days_inactive_min": 90,
    "days_inactive_max": 180,
    "win_back_discount": 15,
    "email_series": "win_back_early",
    "risk_level": "medium",
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Dormant Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_dormant',
  'Dormant',
  '{
    "type": "re_engagement",
    "description": "Customers with no purchase in 180+ days",
    "auto_segment": true,
    "days_inactive": 180,
    "win_back_discount": 20,
    "email_series": "win_back_aggressive",
    "risk_level": "high",
    "last_chance": true,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Big & Tall Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_big_tall',
  'Big & Tall',
  '{
    "type": "product_preference",
    "description": "Customers shopping extended sizes",
    "auto_segment": true,
    "trigger_sizes": ["3XL", "4XL", "5XL", "48", "50", "52", "54"],
    "benefits": ["size_guarantee", "extended_catalog", "fit_consultation"],
    "specialized_support": true,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Measurement Saved Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_measurement_saved',
  'Measurement Saved',
  '{
    "type": "profile_complete",
    "description": "Customers with complete measurement profiles",
    "auto_segment": true,
    "has_measurements": true,
    "benefits": ["perfect_fit_guarantee", "virtual_fitting", "alteration_preview"],
    "conversion_boost": 0.4,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- High AOV Group
INSERT INTO "customer_group" (id, name, metadata, created_at, updated_at) 
VALUES (
  'cg_high_aov',
  'High AOV',
  '{
    "type": "value_segment",
    "description": "Customers with average order > $500",
    "auto_segment": true,
    "min_aov": 500,
    "benefits": ["premium_support", "exclusive_offers", "concierge_service"],
    "expected_ltv": 2500,
    "kct_segment": true
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (name) DO NOTHING;

-- Display summary
SELECT 
  name,
  metadata->>'type' as segment_type,
  metadata->>'description' as description,
  (metadata->>'auto_segment')::boolean as auto_segment,
  created_at
FROM customer_group 
WHERE metadata->>'kct_segment' = 'true'
ORDER BY created_at DESC;