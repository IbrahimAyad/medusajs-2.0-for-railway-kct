import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Get products that came from Shopify
    const productService = req.scope.resolve("product")
    
    // Query products with Shopify metadata
    const products = await productService.list({
      metadata: {
        source: "shopify"
      }
    }, {
      relations: ["variants", "images"],
      take: 100
    })

    // Format for UI
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      vendor: product.metadata?.vendor || "Shopify",
      sku: product.variants?.[0]?.sku || "",
      inventory: product.variants?.[0]?.inventory_quantity || 0,
      price: product.variants?.[0]?.prices?.[0]?.amount || 0,
      image: product.thumbnail || product.images?.[0]?.url,
      synced: true,
      shopifyId: product.metadata?.shopify_id
    }))

    res.json({
      products: formattedProducts,
      lastSync: new Date().toISOString(),
      totalCount: products.length
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch Shopify products",
      message: error.message 
    })
  }
}