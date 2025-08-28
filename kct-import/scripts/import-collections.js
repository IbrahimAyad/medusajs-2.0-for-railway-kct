#!/usr/bin/env node

/**
 * KCT Menswear - Collections Import Script
 * Imports collections only
 */

const { MedusaApp } = require('@medusajs/medusa')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

dotenv.config()

class CollectionsImporter {
  constructor() {
    this.medusaApp = null
    this.collectionService = null
  }

  async initialize() {
    console.log('🚀 Initializing Medusa for collections import...')
    this.medusaApp = await MedusaApp.create({
      database_url: process.env.DATABASE_URL,
      redis_url: process.env.REDIS_URL,
    })
    
    const container = this.medusaApp.container
    this.collectionService = container.resolve('productCollectionService')
    console.log('✅ Medusa initialized')
  }

  async importCollections() {
    try {
      console.log('📁 Importing KCT Collections...')
      const collectionsPath = path.join(__dirname, '../data/collections.json')
      const collectionsData = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'))

      let imported = 0
      let errors = 0

      for (const collectionData of collectionsData.collections) {
        try {
          await this.collectionService.create(collectionData)
          imported++
          console.log(`✅ ${collectionData.title}`)
        } catch (error) {
          errors++
          console.log(`❌ ${collectionData.title}: ${error.message}`)
        }
      }

      console.log(`\n📊 Results: ${imported} imported, ${errors} errors`)
    } catch (error) {
      console.error('❌ Collections import failed:', error.message)
      throw error
    }
  }

  async run() {
    try {
      await this.initialize()
      await this.importCollections()
      process.exit(0)
    } catch (error) {
      console.error('💥 Failed:', error.message)
      process.exit(1)
    }
  }
}

if (require.main === module) {
  const importer = new CollectionsImporter()
  importer.run()
}

module.exports = CollectionsImporter
