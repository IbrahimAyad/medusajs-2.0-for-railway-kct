import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ProductStatus } from "@medusajs/framework/utils"
import { CSVImportHelper } from "../../../utils/csv-import-helper"

/**
 * CSV Product Import using createProductsWorkflow
 * Bypasses transaction/workflow issues by using direct product creation
 */

interface CSVRow {
  "Product title": string
  "Product handle": string
  "Product description": string
  "Product status": string
  "Product thumbnail": string
  "Variant sku": string
  "Price EUR"?: string
  "Price USD"?: string
  "Option 1 name"?: string
  "Option 1 value"?: string
  "Option 2 name"?: string
  "Option 2 value"?: string
  "Inventory quantity"?: string
}

interface GroupedProduct {
  title: string
  handle: string
  description: string
  status: ProductStatus
  thumbnail: string
  options: Map<string, Set<string>>
  variants: Array<{
    title: string
    sku: string
    prices: Array<{ amount: number; currency_code: string }>
    options: Record<string, string>
    inventory_quantity?: number
  }>
}

// Helper function to parse CSV
function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows")
  }

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim())
  
  // Parse data rows
  const rows: CSVRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row: any = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }
  
  return rows
}

// Helper function to group variants by product
function groupVariantsByProduct(rows: CSVRow[]): Map<string, GroupedProduct> {
  const products = new Map<string, GroupedProduct>()
  
  for (const row of rows) {
    const handle = row["Product handle"] || row["Product Handle"] || ''
    
    if (!handle) continue
    
    if (!products.has(handle)) {
      // Create new product entry
      products.set(handle, {
        title: row["Product title"] || row["Product Title"] || '',
        handle,
        description: row["Product description"] || row["Product Description"] || '',
        status: (row["Product status"] || row["Product Status"] || 'published').toLowerCase() === 'published' 
          ? ProductStatus.PUBLISHED 
          : ProductStatus.DRAFT,
        thumbnail: row["Product thumbnail"] || row["Product Thumbnail"] || '',
        options: new Map(),
        variants: []
      })
    }
    
    const product = products.get(handle)!
    
    // Collect option names and values
    for (let i = 1; i <= 3; i++) {
      const optionName = row[`Option ${i} name`] || row[`Option ${i} Name`]
      const optionValue = row[`Option ${i} value`] || row[`Option ${i} Value`]
      
      if (optionName && optionValue) {
        if (!product.options.has(optionName)) {
          product.options.set(optionName, new Set())
        }
        product.options.get(optionName)!.add(optionValue)
      }
    }
    
    // Create variant
    const variantOptions: Record<string, string> = {}
    for (let i = 1; i <= 3; i++) {
      const optionName = row[`Option ${i} name`] || row[`Option ${i} Name`]
      const optionValue = row[`Option ${i} value`] || row[`Option ${i} Value`]
      if (optionName && optionValue) {
        variantOptions[optionName] = optionValue
      }
    }
    
    // Build variant title from options or use SKU
    const variantTitle = Object.values(variantOptions).join(' / ') || 
                        row["Variant sku"] || row["Variant SKU"] || 'Default'
    
    // Build prices array
    const prices = []
    const priceEUR = row["Price EUR"] || row["Price eur"]
    const priceUSD = row["Price USD"] || row["Price usd"]
    
    if (priceEUR) {
      prices.push({
        amount: Math.round(parseFloat(priceEUR) * 100), // Convert to cents
        currency_code: "eur"
      })
    }
    
    if (priceUSD) {
      prices.push({
        amount: Math.round(parseFloat(priceUSD) * 100), // Convert to cents
        currency_code: "usd"
      })
    }
    
    // Default price if none provided
    if (prices.length === 0) {
      prices.push({
        amount: 0,
        currency_code: "usd"
      })
    }
    
    product.variants.push({
      title: variantTitle,
      sku: row["Variant sku"] || row["Variant SKU"] || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      prices,
      options: variantOptions,
      inventory_quantity: row["Inventory quantity"] ? parseInt(row["Inventory quantity"]) : undefined
    })
  }
  
  return products
}

// GET /admin/import-products - Get import status/info
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Product import endpoint ready",
    instructions: "POST CSV content to import products using createProductsWorkflow",
    csv_format: {
      required_columns: [
        "Product title",
        "Product handle", 
        "Variant sku"
      ],
      optional_columns: [
        "Product description",
        "Product status",
        "Product thumbnail",
        "Price EUR",
        "Price USD",
        "Option 1 name",
        "Option 1 value",
        "Option 2 name", 
        "Option 2 value",
        "Option 3 name",
        "Option 3 value",
        "Inventory quantity"
      ]
    },
    example_curl: `curl -X POST http://localhost:9000/admin/import-products \\
      -H "Content-Type: application/json" \\
      -d '{"csv_content": "Product title,Product handle,...\\nShirt,shirt-001,..."}'`
  })
}

// POST /admin/import-products - Import products from CSV
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { csv_content, csv_file_path, options = {} } = req.body as any
    
    let csvData: string = ""
    
    // Handle CSV content from request body or file
    if (csv_content) {
      csvData = csv_content
    } else if (csv_file_path) {
      // Read from file if path provided
      const fs = await import('fs')
      csvData = fs.readFileSync(csv_file_path, 'utf-8')
    } else {
      return res.status(400).json({
        error: "No CSV data provided",
        message: "Please provide csv_content or csv_file_path"
      })
    }
    
    console.log("[Product Import] Starting CSV import using createProductsWorkflow...")
    
    // Use the robust CSV import helper
    const importer = new CSVImportHelper({
      batchSize: options.batch_size || 10,
      defaultCurrency: options.default_currency || "usd",
      defaultStatus: options.default_status || ProductStatus.PUBLISHED,
      skipInvalid: options.skip_invalid !== false
    })
    
    // Parse and transform CSV
    const rows = importer.parseCSV(csvData)
    console.log(`[Product Import] Parsed ${rows.length} rows from CSV`)
    
    const products = importer.transformToMedusaProducts(rows)
    console.log(`[Product Import] Transformed to ${products.length} unique products`)
    
    // Import using the helper
    const results = await importer.importProducts(req.scope, products)
    
    console.log(`[Product Import] Import completed: ${results.created.length} created, ${results.failed.length} failed`)
    
    res.json({
      success: true,
      message: "Products imported successfully",
      summary: {
        total_products: results.total,
        created: results.created.length,
        failed: results.failed.length
      },
      created_products: results.created.map((p: any) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        variants_count: p.variants?.length || 0
      })),
      failed_products: results.failed
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

// DELETE /admin/import-products - Clear all products (for testing)
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("[Product Import] Clearing products is not implemented in this endpoint")
    res.json({
      message: "To clear products, use the admin dashboard or direct product deletion API"
    })
  } catch (error) {
    res.status(500).json({
      error: "Operation failed",
      message: error.message
    })
  }
}