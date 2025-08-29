import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Simplified Vendor Product Curation System
 * Returns status and instructions for using import-shopify endpoints
 */

// GET /admin/vendor-curation - Status and instructions
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    status: "Use import-shopify endpoints for vendor product management",
    instructions: {
      "1_list_products": {
        method: "GET",
        endpoint: "/admin/import-shopify",
        description: "View all available products from Shopify"
      },
      "2_import_products": {
        method: "POST",
        endpoint: "/admin/import-shopify",
        description: "Import selected products",
        body_example: {
          shopify_ids: ["product_id_1", "product_id_2"],
          import_all: false
        }
      },
      "3_update_inventory": {
        method: "PUT",
        endpoint: "/admin/import-shopify/inventory",
        description: "Sync inventory levels from Shopify"
      }
    },
    shopify_config: {
      domain: process.env.SHOPIFY_DOMAIN || "Not configured",
      token: process.env.SHOPIFY_ACCESS_TOKEN ? "Configured" : "Not set"
    }
  })
}

// POST /admin/vendor-curation - Redirect to import endpoint
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Please use POST /admin/import-shopify to import products",
    body_format: {
      shopify_ids: ["array of product IDs to import"],
      import_all: "boolean - set to true to import all products"
    }
  })
}

// DELETE /admin/vendor-curation/:id - Not implemented
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  res.status(501).json({
    error: "Product deletion not implemented",
    message: "Use the admin panel to manage products after import"
  })
}