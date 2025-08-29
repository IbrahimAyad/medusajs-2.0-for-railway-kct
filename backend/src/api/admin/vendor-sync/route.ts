import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Vendor Sync Status Endpoint
 * Points to the actual import endpoints
 */

// GET /admin/vendor-sync - Check sync configuration
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const stats = {
      shopify_config: {
        domain: process.env.SHOPIFY_DOMAIN || "Not configured",
        token: process.env.SHOPIFY_ACCESS_TOKEN ? "✓ Configured" : "✗ Not set",
        location: process.env.SHOPIFY_LOCATION_ID || "Not configured"
      },
      sync_enabled: !!(process.env.SHOPIFY_DOMAIN && process.env.SHOPIFY_ACCESS_TOKEN),
      endpoints: {
        list_products: "GET /admin/import-shopify",
        import_products: "POST /admin/import-shopify",
        update_inventory: "PUT /admin/import-shopify/inventory"
      },
      workflow: [
        "1. GET /admin/import-shopify - View available Shopify products",
        "2. POST /admin/import-shopify - Import selected products",
        "3. PUT /admin/import-shopify/inventory - Update inventory levels"
      ]
    }
    
    res.json(stats)
  } catch (error) {
    console.error("Error getting sync status:", error)
    res.status(500).json({
      error: "Failed to get sync status",
      message: error.message
    })
  }
}

// POST /admin/vendor-sync - Redirect to proper import endpoint
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Please use the import-shopify endpoints",
    endpoints: {
      "GET /admin/import-shopify": "List available products from Shopify",
      "POST /admin/import-shopify": "Import specific products (pass shopify_ids array)",
      "PUT /admin/import-shopify/inventory": "Update inventory for imported products"
    },
    example: {
      method: "POST",
      url: "/admin/import-shopify",
      body: {
        shopify_ids: ["123456789", "987654321"],
        import_all: false
      }
    }
  })
}