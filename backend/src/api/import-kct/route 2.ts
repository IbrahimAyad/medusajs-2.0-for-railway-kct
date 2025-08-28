import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import * as fs from "fs";
import * as path from "path";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productService = req.scope.resolve(Modules.PRODUCT);
  
  try {
    // Simple check for authorization
    const authHeader = req.headers.authorization;
    if (authHeader !== "Bearer kct-import-2024") {
      return res.status(401).json({ error: "Unauthorized - Use Bearer kct-import-2024" });
    }
    
    // Load collections data
    const collectionsPath = path.join(process.cwd(), "data/collections.json");
    if (!fs.existsSync(collectionsPath)) {
      return res.status(404).json({ error: "Collections data not found" });
    }
    
    const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));
    
    const results = {
      collections: { created: 0, errors: 0 },
      products: { created: 0, errors: 0 },
      details: [] as any[]
    };
    
    // Import collections
    for (const collection of collectionsData.collections) {
      try {
        const created = await productService.createProductCollections([{
          title: collection.title,
          handle: collection.handle,
          metadata: collection.metadata
        }]);
        
        results.collections.created++;
        results.details.push({ type: 'collection', name: collection.title, status: 'created' });
      } catch (error: any) {
        results.collections.errors++;
        results.details.push({ type: 'collection', name: collection.title, status: 'error', error: error.message });
      }
    }
    
    // Import products by category
    const categories = ['suits', 'tuxedos', 'shirts', 'accessories'];
    
    for (const category of categories) {
      const productsPath = path.join(process.cwd(), `data/products/${category}.json`);
      
      if (!fs.existsSync(productsPath)) {
        results.details.push({ type: 'category', name: category, status: 'skipped', error: 'File not found' });
        continue;
      }
      
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      
      for (const product of productsData.products.slice(0, 2)) { // Import only first 2 products per category for testing
        try {
          // Simple variant structure (prices are set separately in v2)
          const variants = product.variants.map((v: any) => ({
            title: v.title,
            sku: v.sku,
            manage_inventory: false
          }));
          
          const productData: any = {
            title: product.title,
            description: product.description || "Premium quality menswear from KCT",
            handle: product.handle,
            status: "draft", // Using draft status
            variants: variants
          };
          
          await productService.createProducts([productData]);
          results.products.created++;
          results.details.push({ type: 'product', name: product.title, category, status: 'created' });
          
        } catch (error: any) {
          results.products.errors++;
          results.details.push({ type: 'product', name: product.title, category, status: 'error', error: error.message });
        }
      }
    }
    
    return res.json({
      success: true,
      message: "KCT import completed",
      results
    });
    
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};