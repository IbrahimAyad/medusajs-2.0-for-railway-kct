#!/usr/bin/env node

/**
 * KCT Menswear - Import Verification Script
 * Verifies that products were imported correctly
 */

const { MedusaApp } = require('@medusajs/medusa')
const dotenv = require('dotenv')

dotenv.config()

class ImportVerifier {
  constructor() {
    this.medusaApp = null
    this.productService = null
    this.collectionService = null
  }

  async initialize() {
    console.log('🚀 Initializing Medusa for verification...')
    this.medusaApp = await MedusaApp.create({
      database_url: process.env.DATABASE_URL,
      redis_url: process.env.REDIS_URL,
    })
    
    const container = this.medusaApp.container
    this.productService = container.resolve('productService')
    this.collectionService = container.resolve('productCollectionService')
    console.log('✅ Medusa initialized')
  }

  async verifyCollections() {
    console.log('\n📁 Verifying Collections...')
    try {
      const collections = await this.collectionService.list()
      const kctCollections = collections.filter(c => 
        c.handle?.includes('business') || 
        c.handle?.includes('wedding') || 
        c.handle?.includes('luxury') || 
        c.handle?.includes('dress-shirts')
      )
      
      console.log(`   Found ${kctCollections.length} KCT collections:`)
      kctCollections.forEach(collection => {
        console.log(`   ✅ ${collection.title} (${collection.handle})`)
      })
      
      return kctCollections.length
    } catch (error) {
      console.error('❌ Collections verification failed:', error.message)
      return 0
    }
  }

  async verifyProducts() {
    console.log('\n👔 Verifying Products...')
    try {
      const products = await this.productService.list({}, { relations: ['variants', 'options'] })
      const kctProducts = products.filter(p => 
        p.tags?.some(tag => ['suits', 'tuxedo', 'dress-shirt', 'tie'].includes(tag.value)) ||
        p.handle?.includes('kct') ||
        p.title?.toLowerCase().includes('suit') ||
        p.title?.toLowerCase().includes('tuxedo')
      )
      
      console.log(`   Found ${kctProducts.length} KCT products:`))
      
      const categoryCounts = {
        suits: 0,
        tuxedos: 0,
        shirts: 0,
        accessories: 0,
        other: 0
      }
      
      let totalVariants = 0
      
      kctProducts.forEach(product => {
        const variantCount = product.variants?.length || 0
        totalVariants += variantCount
        
        // Categorize products
        if (product.title.toLowerCase().includes('tuxedo')) {
          categoryCounts.tuxedos++
        } else if (product.title.toLowerCase().includes('suit')) {
          categoryCounts.suits++
        } else if (product.title.toLowerCase().includes('shirt')) {
          categoryCounts.shirts++
        } else if (product.title.toLowerCase().includes('tie') || product.title.toLowerCase().includes('turtleneck') || product.title.toLowerCase().includes('cardigan')) {
          categoryCounts.accessories++
        } else {
          categoryCounts.other++
        }
        
        console.log(`   ✅ ${product.title} (${variantCount} variants)`)
      })
      
      console.log('\n📊 Product Breakdown:')
      console.log(`   Suits: ${categoryCounts.suits}`)
      console.log(`   Tuxedos: ${categoryCounts.tuxedos}`)
      console.log(`   Shirts: ${categoryCounts.shirts}`)
      console.log(`   Accessories: ${categoryCounts.accessories}`)
      console.log(`   Other: ${categoryCounts.other}`)
      console.log(`   Total Variants: ${totalVariants}`)
      
      return { products: kctProducts.length, variants: totalVariants, breakdown: categoryCounts }
    } catch (error) {
      console.error('❌ Products verification failed:', error.message)
      return { products: 0, variants: 0, breakdown: {} }
    }
  }

  async checkProductOptions() {
    console.log('\n⚙️ Verifying Product Options...')
    try {
      const products = await this.productService.list({}, { relations: ['options', 'variants'] })
      const kctProducts = products.filter(p => p.handle?.includes('slim') || p.handle?.includes('suit') || p.handle?.includes('tuxedo'))
      
      let productsWithOptions = 0
      let productsWithVariants = 0
      
      kctProducts.forEach(product => {
        if (product.options && product.options.length > 0) {
          productsWithOptions++
          console.log(`   ✅ ${product.title}: ${product.options.length} options`)
        }
        
        if (product.variants && product.variants.length > 0) {
          productsWithVariants++
        }
      })
      
      console.log(`\n   Products with options: ${productsWithOptions}`)
      console.log(`   Products with variants: ${productsWithVariants}`)
      
      return { withOptions: productsWithOptions, withVariants: productsWithVariants }
    } catch (error) {
      console.error('❌ Options verification failed:', error.message)
      return { withOptions: 0, withVariants: 0 }
    }
  }

  async generateVerificationReport(collectionsCount, productsData, optionsData) {
    console.log('\n' + '='.repeat(50))
    console.log('📊 KCT IMPORT VERIFICATION REPORT')
    console.log('='.repeat(50))
    console.log(`Collections imported: ${collectionsCount}`)
    console.log(`Products imported: ${productsData.products}`)
    console.log(`Variants created: ${productsData.variants}`)
    console.log(`Products with options: ${optionsData.withOptions}`)
    console.log(`Products with variants: ${optionsData.withVariants}`)
    
    console.log('\n📈 Product Categories:')
    Object.entries(productsData.breakdown).forEach(([category, count]) => {
      console.log(`   ${category.charAt(0).toUpperCase() + category.slice(1)}: ${count}`)
    })
    
    console.log('\n💡 Next Steps:')
    console.log('   1. Update product images with actual URLs')
    console.log('   2. Configure inventory levels')
    console.log('   3. Set up shipping methods')
    console.log('   4. Configure payment providers')
    console.log('   5. Test the storefront')
    
    console.log('\n🎉 Verification completed!')
    console.log('='.repeat(50))
  }

  async run() {
    try {
      console.log('🔍 KCT MENSWEAR - IMPORT VERIFICATION')
      console.log('=====================================\n')
      
      await this.initialize()
      const collectionsCount = await this.verifyCollections()
      const productsData = await this.verifyProducts()
      const optionsData = await this.checkProductOptions()
      
      await this.generateVerificationReport(collectionsCount, productsData, optionsData)
      
      process.exit(0)
    } catch (error) {
      console.error('💥 Verification failed:', error.message)
      console.error(error.stack)
      process.exit(1)
    }
  }
}

if (require.main === module) {
  const verifier = new ImportVerifier()
  verifier.run()
}

module.exports = ImportVerifier
