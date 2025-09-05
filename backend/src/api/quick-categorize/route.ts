/**
 * Quick Categorize - Simplified version
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

interface BatchRequest extends MedusaRequest {
  query: {
    offset?: string
  }
}

export const POST = async (
  req: BatchRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const offset = parseInt(req.query.offset || "0")
    const BATCH_SIZE = 5 // Very small batch
    
    // Get products
    const products = await productModuleService.listProducts(
      {},
      {
        take: BATCH_SIZE,
        skip: offset,
        select: ["id", "title", "handle", "metadata"]
      }
    )
    
    if (products.length === 0) {
      return res.json({ done: true, message: "No more products" })
    }
    
    let updated = 0
    
    for (const product of products) {
      try {
        const title = product.title.toLowerCase()
        const handle = product.handle.toLowerCase()
        
        // Simple categorization
        const collections = []
        const tags = []
        const categories = []
        
        // Collections
        if (title.includes('suit') || title.includes('tuxedo')) {
          collections.push('suits-tuxedos')
          categories.push('suits')
        }
        if (title.includes('vest')) {
          collections.push('accessories')
          categories.push('vests')
        }
        if (title.includes('tie') || title.includes('bowtie')) {
          collections.push('accessories')
          categories.push('ties')
        }
        if (title.includes('prom') || title.includes('sparkle')) {
          collections.push('prom')
        }
        if (title.includes('wedding')) {
          collections.push('wedding')
        }
        if (title.includes('shoe') || title.includes('oxford')) {
          collections.push('footwear')
          categories.push('shoes')
        }
        if (title.includes('coat') || title.includes('jacket')) {
          collections.push('outerwear')
          categories.push('jackets')
        }
        
        // Colors as tags
        const colors = ['black', 'navy', 'gray', 'blue', 'brown', 'white', 'red', 'green', 'purple', 'gold', 'silver', 'mint']
        for (const color of colors) {
          if (title.includes(color)) tags.push(`color-${color}`)
        }
        
        // Style tags
        if (title.includes('slim')) tags.push('slim-fit')
        if (title.includes('modern')) tags.push('modern-fit')
        if (title.includes('classic')) tags.push('classic-fit')
        if (title.includes('double breasted')) tags.push('double-breasted')
        
        // Price tags
        const price = parseFloat(String(product.metadata?.tier_price || 0))
        if (price < 100) tags.push('under-100')
        else if (price < 200) tags.push('100-200')
        else if (price < 300) tags.push('200-300')
        else tags.push('over-300')
        
        // Season tags
        if (title.includes('fall')) tags.push('fall')
        if (title.includes('winter')) tags.push('winter')
        if (title.includes('spring')) tags.push('spring')
        if (title.includes('summer')) tags.push('summer')
        
        // Default collection if none
        if (collections.length === 0) {
          const pricingTier = String(product.metadata?.pricing_tier || '')
          if (pricingTier.includes('SUIT')) {
            collections.push('suits-tuxedos')
          } else if (pricingTier.includes('ACCESSORY')) {
            collections.push('accessories')
          } else {
            collections.push('all-products')
          }
        }
        
        // Update metadata
        await productModuleService.updateProducts(product.id, {
          metadata: {
            ...product.metadata,
            collections: collections.join(','),
            tags: tags.join(','),
            categories: categories.join(','),
            categorized: true
          }
        })
        
        updated++
      } catch (e) {
        // Skip errors
      }
    }
    
    res.json({
      success: true,
      offset,
      processed: products.length,
      updated,
      next_offset: offset + BATCH_SIZE
    })
    
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}