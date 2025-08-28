#!/usr/bin/env node

/**
 * KCT Menswear - Complete Product Import for Medusa v2
 * Imports all products, collections, and categories
 */

const { MedusaApp } = require('@medusajs/medusa')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

// Load environment variables
dotenv.config()

class KCTProductImporter {
  constructor() {
    this.medusaApp = null
    this.productService = null
    this.collectionService = null
    this.categoryService = null
    this.importStats = {
      collections: 0,
      products: 0,
      variants: 0,
      errors: []
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Medusa application...')
      this.medusaApp = await MedusaApp.create({
        database_url: process.env.DATABASE_URL,
        redis_url: process.env.REDIS_URL,
      })
      
      const container = this.medusaApp.container
      this.productService = container.resolve('productService')
      this.collectionService = container.resolve('productCollectionService')
      this.categoryService = container.resolve('productCategoryService')
      
      console.log('✅ Medusa application initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Medusa:', error.message)
      throw error
    }
  }

  async importCollections() {
    try {
      console.log('\n📁 Importing Collections...')
      const collectionsPath = path.join(__dirname, '../data/collections.json')
      const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'))

      for (const collectionData of collectionsData.collections) {
        try {
          await this.collectionService.create(collectionData)
          this.importStats.collections++
          console.log(`   ✅ Created collection: ${collectionData.title}`)
        } catch (error) {
          console.log(`   ❌ Failed to create collection ${collectionData.title}: ${error.message}`)
          this.importStats.errors.push(`Collection ${collectionData.title}: ${error.message}`)
        }
      }
      
      console.log(`📁 Collections imported: ${this.importStats.collections}/${collectionsData.collections.length}`)
    } catch (error) {
      console.error('❌ Collections import failed:', error.message)
      throw error
    }
  }

  async importProducts() {
    const productCategories = ['suits', 'tuxedos', 'shirts', 'accessories']
    
    for (const category of productCategories) {
      await this.importProductCategory(category)
    }
  }

  async importProductCategory(category) {
    try {
      console.log(`\n👔 Importing ${category.toUpperCase()}...`)
      const productsPath = path.join(__dirname, `../data/products/${category}.json`)
      const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'))

      for (const productData of productsData.products) {
        try {
          // Prepare product data for Medusa v2
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
              inventory_quantity: variant.inventory_quantity || 0,
              allow_backorder: variant.allow_backorder || false
            })) || [],
            images: productData.images || [],
            metadata: productData.metadata || {}
          }

          const product = await this.productService.create(medusaProductData)
          this.importStats.products++
          this.importStats.variants += productData.variants?.length || 0
          
          console.log(`   ✅ Created product: ${productData.title} (${productData.variants?.length || 0} variants)`)
        } catch (error) {
          console.log(`   ❌ Failed to create product ${productData.title}: ${error.message}`)
          this.importStats.errors.push(`Product ${productData.title}: ${error.message}`)
        }
      }
      
      console.log(`👔 ${category.toUpperCase()} imported: ${productsData.products.length} products`)
    } catch (error) {
      console.error(`❌ ${category} import failed:`, error.message)
      this.importStats.errors.push(`Category ${category}: ${error.message}`)
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(50))
    console.log('📊 KCT IMPORT REPORT')
    console.log('='.repeat(50))
    console.log(`Collections imported: ${this.importStats.collections}`)
    console.log(`Products imported: ${this.importStats.products}`)
    console.log(`Variants created: ${this.importStats.variants}`)
    console.log(`Errors encountered: ${this.importStats.errors.length}`)
    
    if (this.importStats.errors.length > 0) {
      console.log('\n❌ Errors:')
      this.importStats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
    
    console.log('\n🎉 Import process completed!')
    console.log('💡 Next steps:')
    console.log('   1. Check your Medusa admin panel')
    console.log('   2. Verify products are displaying correctly')
    console.log('   3. Update product images with your actual URLs')
    console.log('   4. Configure shipping and payment methods')
    console.log('='.repeat(50))
  }

  async run() {
    try {
      console.log('🏪 KCT MENSWEAR - MEDUSA V2 PRODUCT IMPORT')
      console.log('==========================================\n')
      
      await this.initialize()
      await this.importCollections()
      await this.importProducts()
      await this.generateReport()
      
      process.exit(0)
    } catch (error) {
      console.error('💥 Import process failed:', error.message)
      console.error(error.stack)
      process.exit(1)
    }
  }
}

// Run the import
if (require.main === module) {
  const importer = new KCTProductImporter()
  importer.run()
}

module.exports = KCTProductImporter
