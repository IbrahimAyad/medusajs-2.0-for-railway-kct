import { 
  ExecArgs,
  ProductCategoryWorkflow,
  ProductWorkflow
} from "@medusajs/framework/workflows-sdk";
import fs from "fs";
import path from "path";

const KCT_DATA_PATH = path.join(__dirname, "../../../kct-import/data");

export default async function seedKCTProducts({ container }: ExecArgs) {
  console.log("🚀 Starting KCT product import using workflows...");

  try {
    // Read collections data
    const collectionsPath = path.join(KCT_DATA_PATH, "collections.json");
    const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, "utf-8"));
    
    // Store category mappings
    const categoryMap = new Map<string, string>();
    
    // Create categories from collections
    console.log("\n📁 Creating categories from collections...");
    for (const collection of collectionsData.collections) {
      try {
        const { result } = await ProductCategoryWorkflow.createProductCategories.run({
          input: {
            product_categories: [{
              name: collection.title,
              handle: collection.handle,
              description: collection.description,
              is_active: true,
              is_internal: false,
              metadata: collection.metadata || {}
            }]
          },
          container
        });
        
        if (result?.length > 0) {
          categoryMap.set(collection.id, result[0].id);
          console.log(`✅ Created category: ${collection.title}`);
        }
      } catch (error: any) {
        if (error.message?.includes("already exists")) {
          console.log(`⚠️ Category already exists: ${collection.title}`);
        } else {
          console.error(`❌ Error creating category ${collection.title}:`, error.message);
        }
      }
    }
    
    // Read and import products
    console.log("\n📦 Importing products...");
    const productsDir = path.join(KCT_DATA_PATH, "products");
    const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith(".json"));
    
    let totalProducts = 0;
    let successfulImports = 0;
    
    for (const file of productFiles) {
      const productsData = JSON.parse(
        fs.readFileSync(path.join(productsDir, file), "utf-8")
      );
      
      console.log(`\n📄 Processing ${file}...`);
      
      for (const product of productsData.products) {
        totalProducts++;
        
        try {
          // Prepare product data for workflow
          const productInput: any = {
            title: product.title,
            handle: product.handle,
            description: product.description || "",
            status: "published",
            tags: product.tags || [],
            metadata: product.metadata || {},
            type_id: null,
            collection_id: null,
            categories: []
          };
          
          // Add category if available
          if (product.collection_id && categoryMap.has(product.collection_id)) {
            productInput.categories = [{ id: categoryMap.get(product.collection_id) }];
          }
          
          // Prepare variants
          if (product.variants && product.variants.length > 0) {
            productInput.variants = product.variants.map((variant: any) => ({
              title: variant.title || product.title,
              sku: variant.sku,
              manage_inventory: variant.manage_inventory || true,
              inventory_quantity: variant.inventory_quantity || 100,
              prices: variant.prices?.map((price: any) => ({
                amount: price.amount,
                currency_code: price.currency_code || "USD",
                region_id: null
              })) || [{
                amount: 10000, // Default $100
                currency_code: "USD",
                region_id: null
              }],
              options: variant.options || []
            }));
          } else {
            // Create default variant if none provided
            productInput.variants = [{
              title: product.title,
              sku: `KCT-${product.handle}`,
              manage_inventory: true,
              inventory_quantity: 100,
              prices: [{
                amount: 10000, // Default $100
                currency_code: "USD",
                region_id: null
              }]
            }];
          }
          
          // Create product using workflow
          const { result } = await ProductWorkflow.createProducts.run({
            input: {
              products: [productInput]
            },
            container
          });
          
          if (result?.length > 0) {
            successfulImports++;
            console.log(`✅ Imported: ${product.title}`);
          }
          
        } catch (error: any) {
          if (error.message?.includes("already exists")) {
            console.log(`⚠️ Product already exists: ${product.title}`);
          } else {
            console.error(`❌ Error importing ${product.title}:`, error.message);
          }
        }
      }
    }
    
    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("✨ KCT Product Import Complete!");
    console.log("=".repeat(50));
    console.log(`📊 Total products processed: ${totalProducts}`);
    console.log(`✅ Successfully imported: ${successfulImports}`);
    console.log(`📁 Categories created: ${categoryMap.size}`);
    console.log("=".repeat(50) + "\n");
    
  } catch (error) {
    console.error("Fatal error during KCT product import:", error);
    throw error;
  }
}