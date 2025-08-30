// SUPABASE TO MEDUSA PRODUCT MIGRATION SCRIPT
// This script migrates products from Supabase to Medusa 2.0

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Configuration
const config = {
  supabase: {
    url: 'YOUR_SUPABASE_URL', // Replace with your Supabase URL
    key: 'YOUR_SUPABASE_ANON_KEY', // Replace with your Supabase anon key
  },
  medusa: {
    host: 'centerbeam.proxy.rlwy.net',
    port: 20197,
    database: 'railway',
    user: 'postgres',
    password: 'MvLLUHcwsDWjPCiWciFTYjQxAlwpxPds'
  }
};

// Initialize clients
const supabase = createClient(config.supabase.url, config.supabase.key);
const pgClient = new Client(config.medusa);

// Helper function to generate Medusa-compatible IDs
function generateId(prefix) {
  const uuid = crypto.randomUUID().substring(0, 16);
  return `${prefix}_${uuid}`;
}

// Helper function to create URL-friendly handles
function createHandle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Size configurations for menswear
const SIZES = {
  regular: Array.from({length: 12}, (_, i) => `${34 + i * 2}R`), // 34R-56R
  short: Array.from({length: 7}, (_, i) => `${34 + i * 2}S`),   // 34S-46S
  long: Array.from({length: 10}, (_, i) => `${38 + i * 2}L`)    // 38L-56L
};

async function migrateProducts() {
  try {
    console.log('🚀 Starting migration from Supabase to Medusa...\n');
    
    // Connect to Medusa database
    await pgClient.connect();
    console.log('✅ Connected to Medusa database\n');

    // 1. Fetch products from Supabase
    console.log('📥 Fetching products from Supabase...');
    const { data: supabaseProducts, error } = await supabase
      .from('products') // Adjust table name if different
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch from Supabase: ${error.message}`);
    }

    console.log(`✅ Found ${supabaseProducts.length} products in Supabase\n`);

    // 2. Process each product
    let successCount = 0;
    let errorCount = 0;

    for (const supProduct of supabaseProducts) {
      try {
        console.log(`Processing: ${supProduct.title || supProduct.name}...`);
        
        const productId = generateId('prod');
        const handle = supProduct.handle || createHandle(supProduct.title || supProduct.name);
        
        // Insert product
        const productQuery = `
          INSERT INTO product (
            id, handle, title, subtitle, description, status, 
            thumbnail, is_giftcard, metadata, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
          ) ON CONFLICT (handle) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            thumbnail = EXCLUDED.thumbnail,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING id;
        `;

        const metadata = {
          sku_base: supProduct.sku || supProduct.style_code,
          vendor: supProduct.vendor || 'KCT Menswear',
          style: supProduct.style_code,
          color: supProduct.color,
          price: supProduct.price || 199.99,
          compare_at_price: supProduct.compare_at_price,
          images: supProduct.images || [],
          supabase_id: supProduct.id
        };

        const result = await pgClient.query(productQuery, [
          productId,
          handle,
          supProduct.title || supProduct.name,
          supProduct.subtitle || supProduct.style_code,
          supProduct.description || '',
          'published',
          supProduct.image_url || supProduct.thumbnail || supProduct.images?.[0] || null,
          false,
          JSON.stringify(metadata)
        ]);

        const actualProductId = result.rows[0].id;

        // Create variants based on product type
        const needsFullSizes = 
          supProduct.category?.toLowerCase().includes('suit') ||
          supProduct.category?.toLowerCase().includes('tuxedo') ||
          supProduct.type?.toLowerCase().includes('suit') ||
          supProduct.type?.toLowerCase().includes('tuxedo');

        if (needsFullSizes) {
          // Add all size variants for suits/tuxedos
          for (const sizeType of ['regular', 'short', 'long']) {
            const sizes = SIZES[sizeType];
            for (const size of sizes) {
              const variantId = generateId('var');
              const sku = `${metadata.sku_base}-${size}`;
              
              await pgClient.query(`
                INSERT INTO product_variant (
                  id, product_id, title, sku, manage_inventory, 
                  allow_backorder, metadata, created_at, updated_at
                ) VALUES (
                  $1, $2, $3, $4, true, false, $5, NOW(), NOW()
                ) ON CONFLICT (sku) DO NOTHING;
              `, [
                variantId,
                actualProductId,
                size,
                sku,
                JSON.stringify({
                  size: size,
                  size_type: sizeType.charAt(0).toUpperCase() + sizeType.slice(1),
                  in_stock: true
                })
              ]);
            }
          }
        } else {
          // Add single variant for other products
          const variantId = generateId('var');
          const sku = metadata.sku_base || `${handle}-default`;
          
          await pgClient.query(`
            INSERT INTO product_variant (
              id, product_id, title, sku, manage_inventory, 
              allow_backorder, metadata, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, true, false, $5, NOW(), NOW()
            ) ON CONFLICT (sku) DO NOTHING;
          `, [
            variantId,
            actualProductId,
            'Default',
            sku,
            JSON.stringify({ in_stock: true })
          ]);
        }

        // Link to sales channel
        await pgClient.query(`
          INSERT INTO product_sales_channel (id, product_id, sales_channel_id, created_at, updated_at)
          SELECT 
            $1, $2, $3, NOW(), NOW()
          WHERE NOT EXISTS (
            SELECT 1 FROM product_sales_channel 
            WHERE product_id = $2 AND sales_channel_id = $3
          );
        `, [
          generateId('psc'),
          actualProductId,
          'sc_01K3S6WP4KCEJX26GNPQKTHTBE' // KCT Menswear
        ]);

        successCount++;
        console.log(`✅ Migrated: ${supProduct.title || supProduct.name}`);

      } catch (productError) {
        console.error(`❌ Failed to migrate ${supProduct.title}: ${productError.message}`);
        errorCount++;
      }
    }

    // 3. Create inventory items and levels
    console.log('\n📦 Creating inventory items...');
    await pgClient.query(`
      INSERT INTO inventory_item (id, sku, created_at, updated_at)
      SELECT DISTINCT
        'invitem_' || substr(gen_random_uuid()::text, 1, 16),
        pv.sku,
        NOW(),
        NOW()
      FROM product_variant pv
      WHERE pv.sku IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM inventory_item ii WHERE ii.sku = pv.sku
      );
    `);

    // 4. Set inventory levels
    console.log('📊 Setting inventory levels...');
    await pgClient.query(`
      INSERT INTO inventory_level (
        id, inventory_item_id, location_id, stocked_quantity,
        reserved_quantity, incoming_quantity, created_at, updated_at
      )
      SELECT 
        'invlvl_' || substr(gen_random_uuid()::text, 1, 16),
        ii.id,
        'sloc_01K3RYPKMN8VRRHMZ890XXVWP5',
        10, -- Default stock quantity
        0, 0, NOW(), NOW()
      FROM inventory_item ii
      WHERE NOT EXISTS (
        SELECT 1 FROM inventory_level il 
        WHERE il.inventory_item_id = ii.id 
        AND il.location_id = 'sloc_01K3RYPKMN8VRRHMZ890XXVWP5'
      );
    `);

    // 5. Link variants to inventory items
    console.log('🔗 Linking variants to inventory...');
    await pgClient.query(`
      INSERT INTO product_variant_inventory_item (
        id, variant_id, inventory_item_id, required_quantity,
        created_at, updated_at
      )
      SELECT 
        'pvii_' || substr(gen_random_uuid()::text, 1, 16),
        pv.id, ii.id, 1, NOW(), NOW()
      FROM product_variant pv
      JOIN inventory_item ii ON ii.sku = pv.sku
      WHERE NOT EXISTS (
        SELECT 1 FROM product_variant_inventory_item pvii
        WHERE pvii.variant_id = pv.id AND pvii.inventory_item_id = ii.id
      );
    `);

    console.log('\n✨ Migration Complete!');
    console.log(`✅ Successfully migrated: ${successCount} products`);
    console.log(`❌ Failed: ${errorCount} products`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pgClient.end();
  }
}

// Run migration
migrateProducts();