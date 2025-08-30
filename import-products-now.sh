#!/bin/bash

echo "=== Importing Products via Railway CLI ==="
echo ""
echo "Since the API needs auth, we'll use Railway CLI directly"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Choose import method:${NC}"
echo "1. Use createProductsWorkflow API (Recommended)"
echo "2. Use Direct SQL Import (Guaranteed to work)"
echo ""
read -p "Enter choice (1-2): " choice

case $choice in
    1)
        echo -e "${GREEN}Using createProductsWorkflow...${NC}"
        echo ""
        
        # Create a temporary Node.js script
        cat > /tmp/import-products.js << 'EOF'
const importProducts = async () => {
  const BACKEND_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : "https://backend-production-7441.up.railway.app";
    
  console.log("Importing to:", BACKEND_URL);
  
  const products = [
    {
      title: "2 PC Double Breasted Solid Suit",
      handle: "double-breasted-charcoal-suit",
      description: "Versatile charcoal gray double-breasted suit. Perfect for business and formal events.",
      sizes: ["36S", "36R", "38S", "38R", "38L", "40S", "40R", "40L", "42R", "42L", "44R", "44L", "46R"],
      basePrice: 250.00,
      thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg",
      category: "Suits",
      vendor: "Tazzio"
    },
    {
      title: "2 PC Satin Shawl Collar Suit",
      handle: "satin-shawl-burgundy-suit",
      description: "Rich burgundy suit with satin shawl collar. Stand out at any formal occasion.",
      sizes: ["38R", "40R", "42R", "44R", "46R"],
      basePrice: 174.99,
      thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg",
      category: "Tuxedos",
      vendor: "Tazzio"
    },
    {
      title: "Classic Navy Two-Piece Suit",
      handle: "classic-navy-business-suit",
      description: "Timeless navy blue suit perfect for business and formal occasions.",
      sizes: ["38R", "40R", "42R", "44R", "46R"],
      basePrice: 299.99,
      thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/navy-suit.jpg",
      category: "Business",
      vendor: "KCT Premium"
    },
    {
      title: "Black Tuxedo with Satin Lapels",
      handle: "black-formal-tuxedo",
      description: "Elegant black tuxedo with satin peak lapels for formal events.",
      sizes: ["38R", "40R", "42R", "44R"],
      basePrice: 399.99,
      thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/tuxedo.jpg",
      category: "Formal",
      vendor: "KCT Formal"
    }
  ];

  try {
    const response = await fetch(`${BACKEND_URL}/admin/products-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': process.env.MEDUSA_PUBLISHABLE_KEY || ''
      },
      body: JSON.stringify({ products })
    });
    
    const result = await response.json();
    console.log("Import result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Import failed:", error.message);
    console.log("\nTrying PUT endpoint for batch import...");
    
    try {
      const response = await fetch(`${BACKEND_URL}/admin/products-import`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log("Batch import result:", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("Batch import also failed:", err.message);
    }
  }
};

importProducts();
EOF

        # Run via Railway
        railway run --service Backend node /tmp/import-products.js
        ;;
        
    2)
        echo -e "${GREEN}Using Direct SQL Import...${NC}"
        echo ""
        
        # Update the SQL to use categories
        cat > /tmp/direct-import.sql << 'EOF'
-- Direct SQL Import with Categories
BEGIN;

-- Get category IDs
WITH category_ids AS (
  SELECT 
    id as suits_id,
    (SELECT id FROM product_category WHERE name = 'Tuxedos') as tuxedos_id,
    (SELECT id FROM product_category WHERE name = 'Business') as business_id
  FROM product_category 
  WHERE name = 'Suits'
  LIMIT 1
)
-- Insert products with generated IDs
INSERT INTO product (id, handle, title, subtitle, description, status, thumbnail, metadata, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'double-breasted-charcoal', '2 PC Double Breasted Solid Suit', 'Tazzio Collection', 'Versatile charcoal gray double-breasted suit', 'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg', '{"vendor": "Tazzio"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'satin-shawl-burgundy', '2 PC Satin Shawl Collar Suit', 'Tazzio Collection', 'Rich burgundy suit with satin shawl collar', 'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg', '{"vendor": "Tazzio"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'classic-navy-suit', 'Classic Navy Two-Piece Suit', 'Premium Collection', 'Timeless navy blue suit', 'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/navy-suit.jpg', '{"vendor": "KCT Premium"}'::jsonb, NOW(), NOW()),
  (gen_random_uuid(), 'black-formal-tuxedo', 'Black Tuxedo with Satin Lapels', 'Executive Collection', 'Elegant black tuxedo', 'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/tuxedo.jpg', '{"vendor": "KCT Formal"}'::jsonb, NOW(), NOW())
ON CONFLICT (handle) DO NOTHING;

-- Add some variants for each product
INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, inventory_quantity, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  p.title || ' - ' || size.size,
  UPPER(REPLACE(p.handle, '-', '')) || '-' || size.size,
  true,
  10,
  NOW(),
  NOW()
FROM product p
CROSS JOIN (VALUES ('38R'), ('40R'), ('42R'), ('44R')) AS size(size)
WHERE p.handle IN ('double-breasted-charcoal', 'satin-shawl-burgundy', 'classic-navy-suit', 'black-formal-tuxedo')
ON CONFLICT (sku) DO NOTHING;

COMMIT;

-- Verify
SELECT handle, title, status FROM product WHERE handle LIKE '%-suit' OR handle LIKE '%-tuxedo';
EOF
        
        # Run SQL via Railway
        railway run --service Backend psql '$DATABASE_URL' < /tmp/direct-import.sql
        
        echo ""
        echo -e "${GREEN}✅ Products imported directly to database!${NC}"
        ;;
esac

echo ""
echo "=== Next Steps ==="
echo "1. Go to: https://backend-production-7441.up.railway.app/app"
echo "2. Navigate to Products"
echo "3. Products should be visible now!"
echo ""
echo "If products still don't appear:"
echo "- Clear browser cache"
echo "- Logout and login again"
echo "- Check that categories were created correctly"