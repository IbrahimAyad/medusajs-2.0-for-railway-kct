#!/usr/bin/env node

/**
 * KCT Menswear - Single Category Product Import
 * Usage: node import-products.js --category=suits
 */

const { MedusaApp } = require('@medusajs/medusa')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

dotenv.config()

class CategoryImporter {
  constructor(category) {
    this.category = category
    this.medusaApp = null
    this.productService = null
  }

  async initialize() {
    console.log(`🚀 Initializing Medusa for ${this.category} import...`)
    this.medusaApp = await MedusaApp.create({
      database_url: process.env.DATABASE_URL,
      redis_url: process.env.REDIS_URL,
    })
    
    const container = this.medusaApp.container
    this.productService = container.resolve('productService')
    console.log('✅ Medusa initialized')
  }

  async importProducts() {
    try {
      console.log(`👔 Importing ${this.category.toUpperCase()}...`)
      const productsPath = path.join(__dirname, `../data/products/${this.category}.json`)
      
      if (!fs.existsSync(productsPath)) {
        throw new Error(`Product file not found: ${productsPath}`)
      }
      
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'))
      let imported = 0
      let errors = 0
      let totalVariants = 0

      for (const productData of productsData.products) {
        try {
          const medusaProductData = {
            title: productData.title,
            handle: productData.handle,
            description: productData.description,
            status: productData.status || 'published',
            tags: productData.tags || [],
            type: productData.type,
            collection_ids: productData.collection_ids || [],
            options: productData.options || [],
            variants: productData.variants?.map(variant => ({
              title: variant.title,
              sku: variant.sku,
              prices: variant.prices || [],
              options: variant.options || [],
              manage_inventory: variant.manage_inventory || true,
              inventory_quantity: variant.inventory_quantity || 0
            })) || [],
            images: productData.images || [],
            metadata: productData.metadata || {}
          }

          await this.productService.create(medusaProductData)
          imported++
          totalVariants += productData.variants?.length || 0
          console.log(`✅ ${productData.title} (${productData.variants?.length || 0} variants)`)
        } catch (error) {
          errors++
          console.log(`❌ ${productData.title}: ${error.message}`)
        }
      }

      console.log(`\n📊 ${this.category.toUpperCase()} Results:`)
      console.log(`   Products: ${imported}/${productsData.products.length}`)
      console.log(`   Variants: ${totalVariants}`)
      console.log(`   Errors: ${errors}`)
      
    } catch (error) {
      console.error(`❌ ${this.category} import failed:`, error.message)
      throw error
    }
  }

  async run() {
    try {
      await this.initialize()
      await this.importProducts()
      console.log(`\n🎉 ${this.category.toUpperCase()} import completed!`)
      process.exit(0)
    } catch (error) {
      console.error('💥 Failed:', error.message)
      process.exit(1)
    }
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const categoryArg = args.find(arg => arg.startsWith('--category='))
  
  if (!categoryArg) {
    console.error('❌ Missing category argument')
    console.log('Usage: node import-products.js --category=suits')
    console.log('Available categories: suits, tuxedos, shirts, accessories')
    process.exit(1)
  }
  
  const category = categoryArg.split('=')[1]
  const validCategories = ['suits', 'tuxedos', 'shirts', 'accessories']
  
  if (!validCategories.includes(category)) {
    console.error(`❌ Invalid category: ${category}`)
    console.log(`Valid categories: ${validCategories.join(', ')}`)
    process.exit(1)
  }
  
  return category
}

if (require.main === module) {
  const category = parseArgs()
  const importer = new CategoryImporter(category)
  importer.run()
}

module.exports = CategoryImporter
