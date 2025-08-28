import fs from 'fs';
import path from 'path';

const KCT_DATA_PATH = path.join(__dirname, '../../../kct-import/data');
const OUTPUT_PATH = path.join(__dirname, '../../../kct-products-import.csv');

interface KCTProduct {
  title: string;
  handle: string;
  description: string;
  status: string;
  type?: { value: string };
  collection_ids?: string[];
  tags?: string[];
  images?: Array<{ url: string }>;
  options?: Array<{ title: string; values: string[] }>;
  variants: Array<{
    title: string;
    sku: string;
    prices: Array<{ amount: number; currency_code: string }>;
    options?: Array<{ value: string }>;
    manage_inventory: boolean;
    inventory_quantity: number;
  }>;
  metadata?: any;
}

function convertToCsv() {
  console.log('🔄 Converting KCT products to Medusa CSV format...\n');

  // CSV Headers matching the template
  const headers = [
    'Product Id', 'Product Handle', 'Product Title', 'Product Subtitle', 'Product Description',
    'Product Status', 'Product Thumbnail', 'Product Weight', 'Product Length', 'Product Width',
    'Product Height', 'Product HS Code', 'Product Origin Country', 'Product MID Code',
    'Product Material', 'Product Collection Id', 'Product Type Id', 'Product Tag 1',
    'Product Discountable', 'Product External Id', 'Variant Id', 'Variant Title',
    'Variant SKU', 'Variant Barcode', 'Variant Allow Backorder', 'Variant Manage Inventory',
    'Variant Weight', 'Variant Length', 'Variant Width', 'Variant Height',
    'Variant HS Code', 'Variant Origin Country', 'Variant MID Code', 'Variant Material',
    'Variant Price EUR', 'Variant Price USD', 'Variant Option 1 Name', 'Variant Option 1 Value',
    'Variant Option 2 Name', 'Variant Option 2 Value', 'Product Image 1 Url', 'Product Image 2 Url'
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.join(','));

  // Read all product files
  const productsDir = path.join(KCT_DATA_PATH, 'products');
  const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));

  let totalVariants = 0;

  for (const file of productFiles) {
    console.log(`📄 Processing ${file}...`);
    const productsData = JSON.parse(
      fs.readFileSync(path.join(productsDir, file), 'utf-8')
    );

    for (const product of productsData.products) {
      const kctProduct = product as KCTProduct;
      
      // Get product images
      const image1 = kctProduct.images?.[0]?.url || '';
      const image2 = kctProduct.images?.[1]?.url || '';
      
      // Get first tag
      const tag1 = kctProduct.tags?.[0] || '';
      
      // Get collection ID (using first one)
      const collectionId = kctProduct.collection_ids?.[0] || '';
      
      // Get product type
      const productType = kctProduct.type?.value || '';
      
      // Process each variant
      if (kctProduct.variants && kctProduct.variants.length > 0) {
        for (const variant of kctProduct.variants) {
          const usdPrice = variant.prices.find(p => p.currency_code === 'USD');
          const eurPrice = variant.prices.find(p => p.currency_code === 'EUR');
          
          // Get option values
          const option1Name = kctProduct.options?.[0]?.title || 'Size';
          const option1Value = variant.options?.[0]?.value || '';
          const option2Name = kctProduct.options?.[1]?.title || '';
          const option2Value = variant.options?.[1]?.value || '';
          
          const row = [
            '', // Product Id (leave empty for new products)
            kctProduct.handle,
            kctProduct.title,
            '', // Product Subtitle
            `"${kctProduct.description.replace(/"/g, '""')}"`, // Escape quotes in description
            kctProduct.status || 'published',
            image1,
            '400', // Default weight
            '', // Length
            '', // Width
            '', // Height
            '', // HS Code
            '', // Origin Country
            '', // MID Code
            '', // Material
            collectionId,
            productType,
            tag1,
            'TRUE', // Discountable
            '', // External Id
            '', // Variant Id (leave empty for new variants)
            variant.title,
            variant.sku,
            '', // Barcode
            'FALSE', // Allow Backorder
            variant.manage_inventory ? 'TRUE' : 'FALSE',
            '', // Variant Weight
            '', // Variant Length
            '', // Variant Width
            '', // Variant Height
            '', // Variant HS Code
            '', // Variant Origin Country
            '', // Variant MID Code
            '', // Variant Material
            eurPrice ? (eurPrice.amount / 100).toFixed(2) : '', // Convert cents to dollars
            usdPrice ? (usdPrice.amount / 100).toFixed(2) : '', // Convert cents to dollars
            option1Name,
            option1Value,
            option2Name,
            option2Value,
            image1,
            image2
          ];
          
          csvRows.push(row.join(','));
          totalVariants++;
        }
      } else {
        // Create a single default variant if none exist
        const row = [
          '', // Product Id
          kctProduct.handle,
          kctProduct.title,
          '', // Product Subtitle
          `"${kctProduct.description.replace(/"/g, '""')}"`,
          kctProduct.status || 'published',
          image1,
          '400', // Default weight
          '', '', '', '', '', '', '', // Physical dimensions
          collectionId,
          productType,
          tag1,
          'TRUE', // Discountable
          '', // External Id
          '', // Variant Id
          kctProduct.title,
          `KCT-${kctProduct.handle.toUpperCase()}`,
          '', // Barcode
          'FALSE', // Allow Backorder
          'TRUE', // Manage Inventory
          '', '', '', '', '', '', '', '', // Variant physical attributes
          '', // EUR price
          '100.00', // Default USD price
          'Size',
          'One Size',
          '', // Option 2 Name
          '', // Option 2 Value
          image1,
          image2
        ];
        
        csvRows.push(row.join(','));
        totalVariants++;
      }
    }
  }

  // Write CSV file
  fs.writeFileSync(OUTPUT_PATH, csvRows.join('\n'), 'utf-8');
  
  console.log('\n✨ Conversion complete!');
  console.log(`📊 Total variants created: ${totalVariants}`);
  console.log(`📁 Output file: ${OUTPUT_PATH}`);
  console.log('\nYou can now import this CSV file in your Medusa admin panel.');
}

// Run the conversion
convertToCsv();