import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import fs from 'fs';
import path from 'path';

const KCT_DATA_PATH = path.join(__dirname, '../../../kct-import/data');

interface KCTCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
}

interface KCTProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  collection_id: string;
  status: string;
  tags: string[];
  type: string;
  material: string;
  metadata: Record<string, any>;
  variants: Array<{
    sku: string;
    title: string;
    manage_inventory: boolean;
    inventory_quantity: number;
    prices: Array<{
      amount: number;
      currency_code: string;
    }>;
    options: Array<{
      option: string;
      value: string;
    }>;
  }>;
}

export default async function importKCTProducts(container: MedusaContainer) {
  const productService = container.resolve("product");
  const categoryService = container.resolve("product_category");
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  
  try {
    console.log("🚀 Starting KCT product import...");
    
    // Read collections
    const collectionsPath = path.join(KCT_DATA_PATH, 'collections.json');
    const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, 'utf-8'));
    
    // Create product categories from collections
    const categoryMap = new Map<string, string>();
    
    for (const collection of collectionsData.collections) {
      console.log(`Creating category: ${collection.title}`);
      
      try {
        // Check if category already exists
        const existingCategories = await query.graph({
          entity: "ProductCategory",
          filters: { handle: collection.handle },
          fields: ["id", "handle", "name"]
        });
        
        let categoryId;
        if (existingCategories.data?.length > 0) {
          categoryId = existingCategories.data[0].id;
          console.log(`Category already exists: ${collection.title}`);
        } else {
          const category = await categoryService.createProductCategories({
            name: collection.title,
            handle: collection.handle,
            description: collection.description,
            is_active: true,
            is_internal: false,
            metadata: collection.metadata || {}
          });
          categoryId = category.id;
          console.log(`Created category: ${collection.title}`);
        }
        
        categoryMap.set(collection.id, categoryId);
      } catch (error) {
        console.error(`Error creating category ${collection.title}:`, error);
      }
    }
    
    // Read and import products
    const productsDir = path.join(KCT_DATA_PATH, 'products');
    const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'));
    
    let totalProducts = 0;
    let successfulImports = 0;
    
    for (const file of productFiles) {
      const productsData = JSON.parse(
        fs.readFileSync(path.join(productsDir, file), 'utf-8')
      );
      
      console.log(`\nImporting products from ${file}...`);
      
      for (const product of productsData.products) {
        totalProducts++;
        
        try {
          // Check if product already exists
          const existingProducts = await query.graph({
            entity: "Product",
            filters: { handle: product.handle },
            fields: ["id", "handle"]
          });
          
          if (existingProducts.data?.length > 0) {
            console.log(`Product already exists: ${product.title}`);
            continue;
          }
          
          // Prepare product data
          const productData: any = {
            title: product.title,
            handle: product.handle,
            description: product.description,
            status: "published",
            tags: product.tags?.map((tag: string) => ({ value: tag })) || [],
            metadata: product.metadata || {},
            categories: categoryMap.has(product.collection_id) 
              ? [{ id: categoryMap.get(product.collection_id) }]
              : []
          };
          
          // Prepare variants
          if (product.variants && product.variants.length > 0) {
            productData.variants = product.variants.map((variant: any) => ({
              title: variant.title,
              sku: variant.sku,
              manage_inventory: variant.manage_inventory || false,
              inventory_quantity: variant.inventory_quantity || 0,
              prices: variant.prices?.map((price: any) => ({
                amount: price.amount,
                currency_code: price.currency_code || "USD"
              })) || [],
              options: variant.options || []
            }));
          }
          
          // Create product
          await productService.createProducts(productData);
          successfulImports++;
          console.log(`✅ Imported: ${product.title}`);
          
        } catch (error) {
          console.error(`❌ Error importing ${product.title}:`, error);
        }
      }
    }
    
    console.log("\n========================================");
    console.log(`✨ KCT Product Import Complete!`);
    console.log(`Total products processed: ${totalProducts}`);
    console.log(`Successfully imported: ${successfulImports}`);
    console.log(`Categories created: ${categoryMap.size}`);
    console.log("========================================\n");
    
  } catch (error) {
    console.error("Error during KCT product import:", error);
    throw error;
  }
}