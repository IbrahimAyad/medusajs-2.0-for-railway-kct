import { Migration } from '@mikro-orm/migrations';

export class CreateVendorProducts extends Migration {
  async up(): Promise<void> {
    // Create vendor_products table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vendor_products (
        id TEXT PRIMARY KEY,
        shopify_product_id TEXT UNIQUE NOT NULL,
        shopify_handle TEXT,
        title TEXT NOT NULL,
        vendor TEXT,
        product_type TEXT,
        tags TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'imported', 'rejected', 'updated')),
        vendor_price NUMERIC,
        our_price NUMERIC,
        compare_at_price NUMERIC,
        currency_code TEXT DEFAULT 'USD',
        description TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        options JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        medusa_product_id TEXT,
        last_synced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        imported_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create vendor_product_variants table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vendor_product_variants (
        id TEXT PRIMARY KEY,
        vendor_product_id TEXT NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE,
        shopify_variant_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        sku TEXT NOT NULL,
        barcode TEXT,
        vendor_price NUMERIC,
        our_price NUMERIC,
        compare_at_price NUMERIC,
        inventory_quantity INTEGER DEFAULT 0,
        weight NUMERIC,
        weight_unit TEXT,
        options JSONB DEFAULT '[]'::jsonb,
        metadata JSONB DEFAULT '{}'::jsonb,
        medusa_variant_id TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    this.addSql('CREATE INDEX idx_vendor_products_status ON vendor_products(status);');
    this.addSql('CREATE INDEX idx_vendor_products_shopify_id ON vendor_products(shopify_product_id);');
    this.addSql('CREATE INDEX idx_vendor_products_medusa_id ON vendor_products(medusa_product_id);');
    this.addSql('CREATE INDEX idx_vendor_variants_shopify_id ON vendor_product_variants(shopify_variant_id);');
    this.addSql('CREATE INDEX idx_vendor_variants_sku ON vendor_product_variants(sku);');

    // Create sync history table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS vendor_sync_history (
        id TEXT PRIMARY KEY,
        sync_type TEXT CHECK (sync_type IN ('full', 'inventory', 'manual')),
        status TEXT CHECK (status IN ('started', 'completed', 'failed')),
        products_synced INTEGER DEFAULT 0,
        products_updated INTEGER DEFAULT 0,
        products_added INTEGER DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `);
  }

  async down(): Promise<void> {
    this.addSql('DROP TABLE IF EXISTS vendor_sync_history;');
    this.addSql('DROP TABLE IF EXISTS vendor_product_variants;');
    this.addSql('DROP TABLE IF EXISTS vendor_products;');
  }
}