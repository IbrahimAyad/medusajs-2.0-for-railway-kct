const fs = require('fs');
const path = require('path');

// Import product data from your existing files
const { stripeProducts } = require('../src/lib/services/stripeProductService');
const { dressShirtProducts } = require('../src/lib/products/dressShirtProducts');
const { tieProducts } = require('../src/lib/products/tieProducts');

// Convert to API-friendly format
function convertToAPIFormat() {
  const products = [];
  
  // Convert Suits
  Object.entries(stripeProducts.suits).forEach(([color, data]) => {
    // 2-piece
    products.push({
      sku: `KCT-SUIT-${color.toUpperCase()}-2P`,
      name: `${color.charAt(0).toUpperCase() + color.slice(1).replace(/([A-Z])/g, ' $1')} Suit (2-Piece)`,
      category: 'suit',
      subcategory: '2-piece',
      color: color,
      price: 179.99,
      stripe_product_id: data.productId,
      stripe_price_id: data.twoPiece,
      image_url: `https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/${color}/main.jpg`,
      variants: generateSuitSizes().map(size => ({
        sku: `KCT-SUIT-${color.toUpperCase()}-2P-${size}`,
        size: size,
        inventory: 10 // Default inventory
      }))
    });
    
    // 3-piece
    products.push({
      sku: `KCT-SUIT-${color.toUpperCase()}-3P`,
      name: `${color.charAt(0).toUpperCase() + color.slice(1).replace(/([A-Z])/g, ' $1')} Suit (3-Piece)`,
      category: 'suit',
      subcategory: '3-piece',
      color: color,
      price: 199.99,
      stripe_product_id: data.productId,
      stripe_price_id: data.threePiece,
      image_url: `https://pub-46371bda6faf4910b74631159fc2dfd4.r2.dev/kct-prodcuts/suits/${color}/main.jpg`,
      variants: generateSuitSizes().map(size => ({
        sku: `KCT-SUIT-${color.toUpperCase()}-3P-${size}`,
        size: size,
        inventory: 10
      }))
    });
  });
  
  // Convert Dress Shirts
  dressShirtProducts.colors.forEach(shirt => {
    // Slim fit
    products.push({
      sku: `KCT-SHIRT-${shirt.id.toUpperCase()}-SLIM`,
      name: `${shirt.name} Dress Shirt (Slim)`,
      category: 'dress-shirt',
      subcategory: 'slim',
      color: shirt.id,
      price: 39.99,
      stripe_product_id: dressShirtProducts.fits.slim.productId,
      stripe_price_id: dressShirtProducts.fits.slim.priceId,
      image_url: shirt.imageUrl,
      variants: ['S', 'M', 'L', 'XL', 'XXL'].map(size => ({
        sku: `KCT-SHIRT-${shirt.id.toUpperCase()}-SLIM-${size}`,
        size: size,
        inventory: 20
      }))
    });
    
    // Classic fit
    products.push({
      sku: `KCT-SHIRT-${shirt.id.toUpperCase()}-CLASSIC`,
      name: `${shirt.name} Dress Shirt (Classic)`,
      category: 'dress-shirt',
      subcategory: 'classic',
      color: shirt.id,
      price: 39.99,
      stripe_product_id: dressShirtProducts.fits.classic.productId,
      stripe_price_id: dressShirtProducts.fits.classic.priceId,
      image_url: shirt.imageUrl,
      variants: dressShirtProducts.fits.classic.neckSizes.map(size => ({
        sku: `KCT-SHIRT-${shirt.id.toUpperCase()}-CLASSIC-${size.replace('"', '')}`,
        size: size,
        inventory: 15
      }))
    });
  });
  
  // Convert first 20 ties as sample
  tieProducts.colors.slice(0, 20).forEach(tie => {
    ['classic', 'skinny', 'slim', 'bowtie'].forEach(style => {
      const styleData = tieProducts.styles[style];
      products.push({
        sku: `KCT-TIE-${tie.id.toUpperCase()}-${style.toUpperCase()}`,
        name: `${tie.displayName} ${styleData.name}`,
        category: 'tie',
        subcategory: style,
        color: tie.id,
        price: styleData.price,
        stripe_product_id: styleData.productId,
        stripe_price_id: styleData.priceId,
        image_url: tie.imageUrl,
        variants: [{
          sku: `KCT-TIE-${tie.id.toUpperCase()}-${style.toUpperCase()}`,
          size: 'One Size',
          inventory: 50
        }]
      });
    });
  });
  
  return products;
}

function generateSuitSizes() {
  return [
    '34S', '34R', '36S', '36R', '38S', '38R', '38L',
    '40S', '40R', '40L', '42S', '42R', '42L',
    '44S', '44R', '44L', '46S', '46R', '46L',
    '48S', '48R', '48L', '50S', '50R', '50L',
    '52R', '52L', '54R', '54L'
  ];
}

// Export functions for different formats
function exportAsJSON() {
  const products = convertToAPIFormat();
  fs.writeFileSync(
    path.join(__dirname, 'products-api-format.json'),
    JSON.stringify({ products }, null, 2)
  );
  console.log(`✅ Exported ${products.length} products to products-api-format.json`);
}

function exportAsSQLInserts() {
  const products = convertToAPIFormat();
  let sql = '-- KCT Menswear Product Import\n\n';
  
  products.forEach(product => {
    sql += `INSERT INTO products (sku, name, category, subcategory, price, stripe_product_id, stripe_price_id, image_url) VALUES (\n`;
    sql += `  '${product.sku}',\n`;
    sql += `  '${product.name.replace(/'/g, "''")}',\n`;
    sql += `  '${product.category}',\n`;
    sql += `  '${product.subcategory}',\n`;
    sql += `  ${product.price},\n`;
    sql += `  '${product.stripe_product_id}',\n`;
    sql += `  '${product.stripe_price_id}',\n`;
    sql += `  '${product.image_url}'\n`;
    sql += `);\n\n`;
    
    // Add variants
    product.variants.forEach(variant => {
      sql += `INSERT INTO product_variants (product_sku, variant_sku, size, inventory) VALUES (\n`;
      sql += `  '${product.sku}',\n`;
      sql += `  '${variant.sku}',\n`;
      sql += `  '${variant.size}',\n`;
      sql += `  ${variant.inventory}\n`;
      sql += `);\n`;
    });
    sql += '\n';
  });
  
  fs.writeFileSync(
    path.join(__dirname, 'products-sql-import.sql'),
    sql
  );
  console.log(`✅ Exported ${products.length} products to products-sql-import.sql`);
}

function exportAsBatchAPI() {
  const products = convertToAPIFormat();
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < products.length; i += batchSize) {
    batches.push({
      batch_number: Math.floor(i / batchSize) + 1,
      products: products.slice(i, i + batchSize)
    });
  }
  
  fs.writeFileSync(
    path.join(__dirname, 'products-batch-import.json'),
    JSON.stringify({ 
      total_products: products.length,
      total_batches: batches.length,
      batch_size: batchSize,
      batches 
    }, null, 2)
  );
  console.log(`✅ Exported ${products.length} products in ${batches.length} batches to products-batch-import.json`);
}

// Bundle export
function exportBundles() {
  const bundles = [
    // Tie Bundles
    {
      sku: 'KCT-BUNDLE-TIE-5',
      name: '5-Tie Bundle',
      type: 'tie_bundle',
      price: 99.95,
      stripe_product_id: 'prod_SlSJJXCklqQLJh',
      stripe_price_id: 'price_1RpvLrCHc12x7sCzMiPu7crt',
      components: { ties: 5 }
    },
    {
      sku: 'KCT-BUNDLE-TIE-8',
      name: '8-Tie Bundle',
      type: 'tie_bundle',
      price: 149.95,
      stripe_product_id: 'prod_SlSJVpvJgGyQEg',
      stripe_price_id: 'price_1RpvM9CHc12x7sCzqkW3QKUV',
      components: { ties: 8 }
    },
    {
      sku: 'KCT-BUNDLE-TIE-11',
      name: '11-Tie Bundle',
      type: 'tie_bundle',
      price: 199.95,
      stripe_product_id: 'prod_SlSJgL1j8P2pQr',
      stripe_price_id: 'price_1RpvMNCHc12x7sCziN5XLR9K',
      components: { ties: 11 }
    },
    // Suit Bundles
    {
      sku: 'KCT-BUNDLE-ESSENTIAL',
      name: 'Essential Bundle',
      type: 'suit_bundle',
      price: 199.99,
      components: { suit: '2-piece', shirt: 1, tie: 1 }
    },
    {
      sku: 'KCT-BUNDLE-PROFESSIONAL',
      name: 'Professional Bundle',
      type: 'suit_bundle',
      price: 229.99,
      components: { suit: '3-piece', shirt: 1, tie: 1 }
    },
    {
      sku: 'KCT-BUNDLE-EXECUTIVE',
      name: 'Executive Bundle',
      type: 'suit_bundle',
      price: 249.99,
      components: { suit: '3-piece', shirt: 2, tie: 2 }
    }
  ];
  
  fs.writeFileSync(
    path.join(__dirname, 'bundles-import.json'),
    JSON.stringify({ bundles }, null, 2)
  );
  console.log(`✅ Exported ${bundles.length} bundles to bundles-import.json`);
}

// Run all exports
console.log('🚀 Starting KCT Menswear product export...\n');
exportAsJSON();
exportAsSQLInserts();
exportAsBatchAPI();
exportBundles();
console.log('\n✅ All exports completed! Check the backend-integration folder for files.');

// Note: To run this script, you'll need to adjust the import paths
// based on your actual project structure