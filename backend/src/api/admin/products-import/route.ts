import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"

/**
 * Proper Product Import using createProductsWorkflow
 * Following the exact pattern from seed.ts
 */

interface ProductImportData {
  title: string
  handle: string
  description?: string
  thumbnail?: string
  sizes?: string[]
  basePrice?: number
  category?: string
  vendor?: string
}

// GET /admin/products-import - Check status
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Product import endpoint ready",
    instructions: "POST with product data to import",
    example: {
      products: [
        {
          title: "Navy Suit",
          handle: "navy-suit",
          description: "Classic navy suit",
          sizes: ["38R", "40R", "42R", "44R", "46R"],
          basePrice: 599.99,
          thumbnail: "https://example.com/image.jpg"
        }
      ]
    }
  })
}

// POST /admin/products-import - Import products
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { products: inputProducts = [] } = req.body as { products: ProductImportData[] }
    
    if (!inputProducts.length) {
      return res.status(400).json({
        error: "No products provided",
        message: "Please provide an array of products to import"
      })
    }

    console.log(`[Product Import] Starting import of ${inputProducts.length} products`)

    // Get sales channel (required for products)
    const salesChannelModuleService = req.scope.resolve(Modules.SALES_CHANNEL)
    const salesChannels = await salesChannelModuleService.listSalesChannels({
      name: "Default Sales Channel"
    })
    
    if (!salesChannels.length) {
      return res.status(400).json({
        error: "No default sales channel found",
        message: "Please ensure a default sales channel exists"
      })
    }

    // Transform input products to Medusa format
    const productsToCreate = inputProducts.map(product => {
      // Create variants for each size
      const variants = (product.sizes || ["One Size"]).map(size => ({
        title: `${product.title} - ${size}`,
        sku: `${product.handle}-${size.replace(/[^A-Z0-9]/gi, "")}`.toUpperCase(),
        prices: [
          {
            amount: Math.round((product.basePrice || 0) * 100), // Convert to cents
            currency_code: "usd"
          },
          {
            amount: Math.round((product.basePrice || 0) * 0.9 * 100), // EUR price
            currency_code: "eur"
          }
        ],
        options: {
          Size: size
        },
        manage_inventory: true
      }))

      return {
        title: product.title,
        handle: product.handle,
        description: product.description || "",
        status: "published" as const,
        images: product.thumbnail ? [{ url: product.thumbnail }] : [],
        options: [
          {
            title: "Size",
            values: product.sizes || ["One Size"]
          }
        ],
        variants,
        sales_channels: [
          {
            id: salesChannels[0].id
          }
        ],
        metadata: {
          vendor: product.vendor || "KCT Menswear",
          category: product.category || "Suits",
          imported_at: new Date().toISOString()
        }
      }
    })

    console.log("[Product Import] Creating products with workflow...")

    // Create products using the workflow (same as seed.ts)
    const { result } = await createProductsWorkflow(req.scope).run({
      input: {
        products: productsToCreate
      }
    })

    console.log(`[Product Import] Successfully created ${result.length} products`)

    res.json({
      success: true,
      message: `Successfully imported ${result.length} products`,
      products: result.map(p => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        variants_count: p.variants?.length || 0
      }))
    })

  } catch (error) {
    console.error("[Product Import] Error:", error)
    res.status(500).json({
      error: "Import failed",
      message: error.message,
      details: error.stack
    })
  }
}

// PUT /admin/products-import/batch - Batch import for menswear catalog
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Sample menswear products for quick testing
    const menswearProducts: ProductImportData[] = [
      {
        title: "Classic Navy Two-Piece Suit",
        handle: "classic-navy-suit",
        description: "Timeless navy blue suit perfect for business and formal occasions",
        sizes: ["36S", "36R", "38S", "38R", "38L", "40S", "40R", "40L", "42R", "42L", "44R", "44L", "46R"],
        basePrice: 599.99,
        thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/navy-suit.jpg",
        category: "Suits",
        vendor: "KCT Premium"
      },
      {
        title: "Charcoal Gray Three-Piece Suit",
        handle: "charcoal-three-piece",
        description: "Sophisticated charcoal suit with matching vest",
        sizes: ["38R", "40R", "42R", "44R", "46R"],
        basePrice: 749.99,
        thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/charcoal-suit.jpg",
        category: "Suits",
        vendor: "KCT Premium"
      },
      {
        title: "Black Tuxedo with Satin Lapels",
        handle: "black-tuxedo-satin",
        description: "Elegant black tuxedo with satin peak lapels",
        sizes: ["38R", "40R", "42R", "44R"],
        basePrice: 899.99,
        thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/tuxedo.jpg",
        category: "Tuxedos",
        vendor: "KCT Formal"
      },
      {
        title: "Light Gray Summer Suit",
        handle: "light-gray-summer",
        description: "Lightweight suit perfect for summer weddings",
        sizes: ["38R", "40R", "42R", "44R"],
        basePrice: 499.99,
        thumbnail: "https://cdn.shopify.com/s/files/1/0893/7976/6585/files/summer-suit.jpg",
        category: "Suits",
        vendor: "KCT Seasonal"
      }
    ]

    // Call the POST handler with the sample products
    req.body = { products: menswearProducts }
    return POST(req, res)

  } catch (error) {
    console.error("[Product Import] Batch error:", error)
    res.status(500).json({
      error: "Batch import failed",
      message: error.message
    })
  }
}