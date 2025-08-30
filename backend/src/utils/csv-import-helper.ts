import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { ProductStatus } from "@medusajs/framework/utils"
import * as fs from "fs"
import * as path from "path"

/**
 * CSV Import Helper for Medusa 2.0
 * Handles various CSV formats and transforms them for createProductsWorkflow
 */

export interface ImportOptions {
  batchSize?: number
  defaultCurrency?: string
  defaultStatus?: ProductStatus
  skipInvalid?: boolean
}

export class CSVImportHelper {
  private options: Required<ImportOptions>
  
  constructor(options: ImportOptions = {}) {
    this.options = {
      batchSize: options.batchSize || 10,
      defaultCurrency: options.defaultCurrency || "usd",
      defaultStatus: options.defaultStatus || ProductStatus.PUBLISHED,
      skipInvalid: options.skipInvalid !== false
    }
  }
  
  /**
   * Parse CSV content with flexible header mapping
   */
  parseCSV(csvContent: string): any[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) {
      throw new Error("CSV file is empty or has no data rows")
    }
    
    // Handle different delimiters
    const delimiter = this.detectDelimiter(lines[0])
    
    // Parse headers (handle quotes)
    const headers = this.parseCSVLine(lines[0], delimiter)
    
    // Parse data rows
    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i], delimiter)
      const row: any = {}
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || ''
      })
      
      // Skip empty rows
      if (Object.values(row).some(v => v)) {
        rows.push(row)
      }
    }
    
    return rows
  }
  
  /**
   * Parse a single CSV line handling quotes and escapes
   */
  private parseCSVLine(line: string, delimiter: string = ','): string[] {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }
  
  /**
   * Detect CSV delimiter
   */
  private detectDelimiter(headerLine: string): string {
    const delimiters = [',', ';', '\t', '|']
    let maxCount = 0
    let bestDelimiter = ','
    
    for (const delimiter of delimiters) {
      const count = (headerLine.match(new RegExp(delimiter, 'g')) || []).length
      if (count > maxCount) {
        maxCount = count
        bestDelimiter = delimiter
      }
    }
    
    return bestDelimiter
  }
  
  /**
   * Transform CSV rows to Medusa product format
   */
  transformToMedusaProducts(rows: any[]): any[] {
    const productMap = new Map<string, any>()
    
    for (const row of rows) {
      // Try multiple header variations
      const handle = this.getFieldValue(row, ['Product handle', 'Product Handle', 'handle', 'Handle', 'product_handle'])
      const title = this.getFieldValue(row, ['Product title', 'Product Title', 'title', 'Title', 'product_title', 'Name'])
      const sku = this.getFieldValue(row, ['Variant sku', 'Variant SKU', 'SKU', 'sku', 'variant_sku'])
      
      if (!handle && !title) {
        if (!this.options.skipInvalid) {
          throw new Error(`Invalid row: missing product handle or title`)
        }
        continue
      }
      
      const productKey = handle || this.generateHandle(title)
      
      if (!productMap.has(productKey)) {
        productMap.set(productKey, {
          title: title || handle,
          handle: productKey,
          description: this.getFieldValue(row, ['Product description', 'Description', 'description']),
          status: this.parseStatus(row),
          images: this.parseImages(row),
          options: new Map(),
          variants: [],
          metadata: {
            imported_at: new Date().toISOString(),
            import_source: 'csv'
          }
        })
      }
      
      const product = productMap.get(productKey)
      
      // Parse options (support up to 3 options)
      const variantOptions: Record<string, string> = {}
      for (let i = 1; i <= 3; i++) {
        const optionName = this.getFieldValue(row, [
          `Option ${i} name`, `Option ${i} Name`, `option_${i}_name`, `Option${i}Name`
        ])
        const optionValue = this.getFieldValue(row, [
          `Option ${i} value`, `Option ${i} Value`, `option_${i}_value`, `Option${i}Value`
        ])
        
        if (optionName && optionValue) {
          if (!product.options.has(optionName)) {
            product.options.set(optionName, new Set())
          }
          product.options.get(optionName).add(optionValue)
          variantOptions[optionName] = optionValue
        }
      }
      
      // Create variant
      const variant = {
        title: this.getFieldValue(row, ['Variant title', 'Variant Title', 'variant_title']) ||
                Object.values(variantOptions).join(' / ') || 
                sku || 'Default',
        sku: sku || this.generateSKU(productKey, variantOptions),
        prices: this.parsePrices(row),
        options: variantOptions,
        inventory_quantity: this.parseInventory(row),
        metadata: {}
      }
      
      // Add weight if available
      const weight = this.getFieldValue(row, ['Weight', 'weight', 'Variant Weight'])
      if (weight) {
        variant.metadata.weight = weight
      }
      
      product.variants.push(variant)
    }
    
    // Convert to array and format options
    return Array.from(productMap.values()).map(product => ({
      ...product,
      options: Array.from(product.options.entries()).map(([title, values]) => ({
        title,
        values: Array.from(values)
      }))
    }))
  }
  
  /**
   * Get field value with fallback keys
   */
  private getFieldValue(row: any, keys: string[]): string {
    for (const key of keys) {
      if (row[key] && row[key].trim()) {
        return row[key].trim()
      }
    }
    return ''
  }
  
  /**
   * Generate handle from title
   */
  private generateHandle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
  
  /**
   * Generate SKU
   */
  private generateSKU(handle: string, options: Record<string, string>): string {
    const optionStr = Object.values(options).join('-').toUpperCase().replace(/[^A-Z0-9]/g, '')
    return `${handle.toUpperCase().substring(0, 10)}-${optionStr || 'DEFAULT'}-${Date.now().toString(36)}`
  }
  
  /**
   * Parse product status
   */
  private parseStatus(row: any): ProductStatus {
    const status = this.getFieldValue(row, ['Product status', 'Status', 'status'])
    if (status) {
      const normalized = status.toLowerCase()
      if (normalized === 'published' || normalized === 'active') {
        return ProductStatus.PUBLISHED
      } else if (normalized === 'draft') {
        return ProductStatus.DRAFT
      }
    }
    return this.options.defaultStatus
  }
  
  /**
   * Parse images
   */
  private parseImages(row: any): any[] {
    const images = []
    
    // Main image
    const mainImage = this.getFieldValue(row, [
      'Product thumbnail', 'Product Thumbnail', 'Image', 'image', 'Image URL', 'Product Image'
    ])
    if (mainImage) {
      images.push({ url: mainImage })
    }
    
    // Additional images
    for (let i = 1; i <= 5; i++) {
      const additionalImage = this.getFieldValue(row, [`Image ${i}`, `image_${i}`, `Additional Image ${i}`])
      if (additionalImage) {
        images.push({ url: additionalImage })
      }
    }
    
    return images
  }
  
  /**
   * Parse prices from various formats
   */
  private parsePrices(row: any): any[] {
    const prices = []
    
    // Check for specific currency columns
    const currencies = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'JPY']
    for (const currency of currencies) {
      const price = this.getFieldValue(row, [
        `Price ${currency}`, `Price ${currency.toLowerCase()}`, 
        `price_${currency.toLowerCase()}`, currency
      ])
      if (price) {
        prices.push({
          amount: this.parsePrice(price),
          currency_code: currency.toLowerCase()
        })
      }
    }
    
    // Check for generic price column
    if (prices.length === 0) {
      const genericPrice = this.getFieldValue(row, [
        'Price', 'price', 'Variant Price', 'Product Price', 'Cost'
      ])
      if (genericPrice) {
        prices.push({
          amount: this.parsePrice(genericPrice),
          currency_code: this.options.defaultCurrency
        })
      }
    }
    
    // Default price if none found
    if (prices.length === 0) {
      prices.push({
        amount: 0,
        currency_code: this.options.defaultCurrency
      })
    }
    
    return prices
  }
  
  /**
   * Parse price string to cents
   */
  private parsePrice(priceStr: string): number {
    // Remove currency symbols and whitespace
    const cleaned = priceStr.replace(/[^0-9.,]/g, '')
    // Handle both comma and period as decimal separator
    const normalized = cleaned.replace(',', '.')
    const price = parseFloat(normalized)
    return Math.round((price || 0) * 100) // Convert to cents
  }
  
  /**
   * Parse inventory quantity
   */
  private parseInventory(row: any): number | undefined {
    const inventory = this.getFieldValue(row, [
      'Inventory quantity', 'Inventory Quantity', 'Stock', 'stock', 'Quantity', 'quantity'
    ])
    if (inventory) {
      const qty = parseInt(inventory)
      return isNaN(qty) ? undefined : qty
    }
    return undefined
  }
  
  /**
   * Import products using createProductsWorkflow
   */
  async importProducts(container: any, products: any[]): Promise<any> {
    const results = {
      created: [],
      failed: [],
      total: products.length
    }
    
    // Process in batches
    for (let i = 0; i < products.length; i += this.options.batchSize) {
      const batch = products.slice(i, i + this.options.batchSize)
      
      try {
        const { result } = await createProductsWorkflow(container).run({
          input: {
            products: batch
          }
        })
        
        results.created.push(...result)
        console.log(`[CSV Import] Batch ${Math.floor(i / this.options.batchSize) + 1} completed: ${batch.length} products`)
      } catch (error) {
        console.error(`[CSV Import] Batch ${Math.floor(i / this.options.batchSize) + 1} failed:`, error)
        results.failed.push(...batch.map(p => ({
          handle: p.handle,
          title: p.title,
          error: error.message
        })))
      }
    }
    
    return results
  }
  
  /**
   * Import from file
   */
  async importFromFile(container: any, filePath: string): Promise<any> {
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    const rows = this.parseCSV(csvContent)
    const products = this.transformToMedusaProducts(rows)
    return this.importProducts(container, products)
  }
}

// Export singleton instance with default options
export const csvImporter = new CSVImportHelper()