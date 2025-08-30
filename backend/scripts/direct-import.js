const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function importProducts() {
  console.log("🚀 Direct Product Import Script");
  console.log("================================\n");
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not found!");
    console.log("Run this with: railway run --service Backend node scripts/direct-import.js");
    return;
  }

  console.log("✅ Database connected");
  console.log("📦 Importing products...\n");

  const sql = `
    -- Create products directly
    INSERT INTO product (id, handle, title, subtitle, description, status, thumbnail, metadata, created_at, updated_at)
    VALUES 
      ('prod_${Date.now()}_1', 'charcoal-double-breasted', '2 PC Double Breasted Solid Suit', 'Tazzio Collection', 
       'Versatile charcoal gray double-breasted suit. Perfect for business and formal events.', 
       'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M404SK-03.jpg', 
       '{"vendor": "Tazzio", "category": "Suits"}'::jsonb, NOW(), NOW()),
      
      ('prod_${Date.now()}_2', 'burgundy-shawl-collar', '2 PC Satin Shawl Collar Suit', 'Tazzio Collection', 
       'Rich burgundy suit with satin shawl collar. Stand out at any formal occasion.', 
       'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/M341SK-06.jpg', 
       '{"vendor": "Tazzio", "category": "Tuxedos"}'::jsonb, NOW(), NOW()),
      
      ('prod_${Date.now()}_3', 'navy-classic-business', 'Classic Navy Two-Piece Suit', 'Premium Collection', 
       'Timeless navy blue suit perfect for business and formal occasions.', 
       'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/navy-suit.jpg', 
       '{"vendor": "KCT Premium", "category": "Business"}'::jsonb, NOW(), NOW()),
      
      ('prod_${Date.now()}_4', 'black-formal-tuxedo', 'Black Tuxedo with Satin Lapels', 'Executive Collection', 
       'Elegant black tuxedo with satin peak lapels for weddings and formal events.', 
       'published', 'https://cdn.shopify.com/s/files/1/0893/7976/6585/files/tuxedo.jpg', 
       '{"vendor": "KCT Formal", "category": "Formal"}'::jsonb, NOW(), NOW())
    ON CONFLICT (handle) DO UPDATE SET
      title = EXCLUDED.title,
      updated_at = NOW()
    RETURNING handle, title;
  `;

  try {
    // Use psql command with the connection string
    const command = `psql "${DATABASE_URL}" -c "${sql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('NOTICE')) {
      console.error("⚠️ Warning:", stderr);
    }
    
    console.log("✅ Products imported successfully!");
    console.log(stdout);
    
    // Now add variants
    console.log("\n📏 Adding size variants...");
    
    const variantSql = `
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
      WHERE p.handle IN ('charcoal-double-breasted', 'burgundy-shawl-collar', 'navy-classic-business', 'black-formal-tuxedo')
      ON CONFLICT (sku) DO NOTHING;
    `;
    
    const variantCommand = `psql "${DATABASE_URL}" -c "${variantSql.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
    await execAsync(variantCommand);
    
    console.log("✅ Variants added!");
    
    // Verify import
    const checkCommand = `psql "${DATABASE_URL}" -c "SELECT handle, title, status FROM product WHERE created_at > NOW() - INTERVAL '5 minutes';"`;
    const { stdout: checkResult } = await execAsync(checkCommand);
    
    console.log("\n📊 Imported products:");
    console.log(checkResult);
    
  } catch (error) {
    console.error("❌ Import failed:", error.message);
    console.log("\nTry running:");
    console.log("railway run --service Backend node scripts/direct-import.js");
  }
}

importProducts();