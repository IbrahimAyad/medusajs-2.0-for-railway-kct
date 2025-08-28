import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Public endpoint to test product creation
    const productService = req.scope.resolve(Modules.PRODUCT);
    
    // Check if test product already exists
    const existingProducts = await productService.listProducts({
      handle: ["kct-test-product"]
    });
    
    if (existingProducts && existingProducts.length > 0) {
      return res.json({
        message: "Test product already exists",
        product: existingProducts[0]
      });
    }
    
    // Create a simple test product
    const testProduct = await productService.createProducts([{
      title: "KCT Test Product",
      handle: "kct-test-product",
      description: "This is a test product from KCT Menswear",
      status: "draft" as any, // Using draft status for now
      variants: [{
        title: "Default Variant",
        sku: "TEST-001",
        manage_inventory: false
      }]
    }]);
    
    return res.json({
      success: true,
      message: "Test product created",
      product: testProduct[0]
    });
    
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};