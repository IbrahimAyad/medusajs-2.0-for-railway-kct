/**
 * Auto-Categorize Products
 * Intelligently adds tags, collections, and categories based on product names and attributes
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Smart categorization rules
const CATEGORIZATION_RULES = {
  // Collections (main product groupings)
  collections: {
    'suits-and-tuxedos': {
      keywords: ['suit', 'tuxedo', 'tux', 'double breasted', 'single breasted', '2 pc', '3 pc', 'two piece', 'three piece'],
      name: 'Suits & Tuxedos',
      handle: 'suits-and-tuxedos'
    },
    'wedding-collection': {
      keywords: ['wedding', 'groom', 'groomsmen', 'formal', 'ceremony'],
      name: 'Wedding Collection',
      handle: 'wedding-collection'
    },
    'prom-collection': {
      keywords: ['prom', 'sparkle', 'glitter', 'sequin', 'homecoming', 'dance'],
      name: 'Prom Collection',
      handle: 'prom-collection'
    },
    'accessories': {
      keywords: ['vest', 'tie', 'bowtie', 'bow tie', 'cummerbund', 'suspender', 'pocket square', 'cufflink', 'belt'],
      name: 'Accessories',
      handle: 'accessories'
    },
    'outerwear': {
      keywords: ['coat', 'overcoat', 'jacket', 'blazer', 'puffer', 'windbreaker', 'raincoat'],
      name: 'Outerwear',
      handle: 'outerwear'
    },
    'footwear': {
      keywords: ['shoe', 'oxford', 'loafer', 'boot', 'sneaker', 'dress shoe'],
      name: 'Footwear',
      handle: 'footwear'
    },
    'casual-wear': {
      keywords: ['casual', 'polo', 'jeans', 'khaki', 'chino', 'sweatpants', 'hoodie', 't-shirt'],
      name: 'Casual Wear',
      handle: 'casual-wear'
    },
    'seasonal': {
      keywords: ['fall', 'winter', 'spring', 'summer', 'holiday'],
      name: 'Seasonal Collection',
      handle: 'seasonal'
    }
  },
  
  // Categories (specific product types)
  categories: {
    'suits': ['suit', '2 pc', '3 pc', 'two piece', 'three piece', 'single breasted'],
    'tuxedos': ['tuxedo', 'tux', 'formal wear'],
    'blazers': ['blazer', 'sport coat', 'sports jacket'],
    'dress-shirts': ['dress shirt', 'formal shirt', 'button down', 'french cuff'],
    'vests': ['vest', 'waistcoat'],
    'ties': ['tie', 'necktie', 'silk tie'],
    'bow-ties': ['bowtie', 'bow tie', 'bow-tie'],
    'shoes': ['shoe', 'oxford', 'loafer', 'dress shoe'],
    'pants': ['pant', 'trouser', 'slack', 'dress pant'],
    'casual': ['casual', 'polo', 'khaki', 'sweatpants']
  },
  
  // SEO-friendly tags
  tags: {
    // Colors
    colors: {
      keywords: ['black', 'navy', 'gray', 'grey', 'blue', 'brown', 'tan', 'burgundy', 'white', 'ivory', 'charcoal', 'olive', 'green', 'purple', 'red', 'pink', 'gold', 'silver', 'mint', 'mocha'],
      prefix: 'color-'
    },
    
    // Styles
    styles: {
      'modern-fit': ['modern', 'slim', 'tailored'],
      'classic-fit': ['classic', 'regular', 'traditional'],
      'big-tall': ['big', 'tall', 'plus size'],
      'formal': ['formal', 'ceremony', 'black tie'],
      'business': ['business', 'professional', 'office'],
      'luxury': ['premium', 'luxury', 'designer', 'italian']
    },
    
    // Occasions
    occasions: {
      'wedding': ['wedding', 'groom', 'groomsmen'],
      'prom': ['prom', 'homecoming', 'dance'],
      'business': ['business', 'meeting', 'interview'],
      'special-event': ['gala', 'ceremony', 'formal event'],
      'cocktail': ['cocktail', 'party', 'reception']
    },
    
    // Seasons
    seasons: {
      'fall-winter': ['fall', 'winter', 'autumn', 'cold weather'],
      'spring-summer': ['spring', 'summer', 'lightweight', 'breathable']
    },
    
    // Materials
    materials: {
      'wool': ['wool', 'merino', 'cashmere'],
      'cotton': ['cotton', 'pima'],
      'polyester': ['polyester', 'synthetic'],
      'silk': ['silk', 'satin'],
      'velvet': ['velvet', 'velour']
    },
    
    // Special features
    features: {
      'wrinkle-resistant': ['wrinkle', 'non-iron', 'easy care'],
      'stretch': ['stretch', 'flex', 'comfort'],
      'breathable': ['breathable', 'lightweight', 'airy'],
      'water-resistant': ['water', 'rain', 'weather']
    }
  }
}

// Function to analyze product and generate tags
function analyzeProduct(title: string, handle: string, metadata: any) {
  const lowerTitle = title.toLowerCase()
  const lowerHandle = handle.toLowerCase()
  const combined = `${lowerTitle} ${lowerHandle}`
  
  const result = {
    collections: [] as string[],
    categories: [] as string[],
    tags: [] as string[],
    seo_keywords: [] as string[]
  }
  
  // Find matching collections
  for (const [key, collection] of Object.entries(CATEGORIZATION_RULES.collections)) {
    if (collection.keywords.some(keyword => combined.includes(keyword))) {
      result.collections.push(collection.handle)
    }
  }
  
  // Find matching categories
  for (const [category, keywords] of Object.entries(CATEGORIZATION_RULES.categories)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      result.categories.push(category)
    }
  }
  
  // Extract color tags
  const colorKeywords = CATEGORIZATION_RULES.tags.colors.keywords
  for (const color of colorKeywords) {
    if (combined.includes(color)) {
      result.tags.push(`color-${color}`)
      result.seo_keywords.push(color)
    }
  }
  
  // Add style tags
  for (const [style, keywords] of Object.entries(CATEGORIZATION_RULES.tags.styles)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      result.tags.push(`style-${style}`)
      result.seo_keywords.push(style.replace('-', ' '))
    }
  }
  
  // Add occasion tags
  for (const [occasion, keywords] of Object.entries(CATEGORIZATION_RULES.tags.occasions)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      result.tags.push(`occasion-${occasion}`)
      result.seo_keywords.push(occasion.replace('-', ' '))
    }
  }
  
  // Add season tags
  for (const [season, keywords] of Object.entries(CATEGORIZATION_RULES.tags.seasons)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      result.tags.push(`season-${season}`)
    }
  }
  
  // Add price range tags based on metadata
  if (metadata?.tier_price) {
    const price = parseFloat(metadata.tier_price)
    if (price < 100) result.tags.push('price-under-100')
    else if (price < 200) result.tags.push('price-100-200')
    else if (price < 300) result.tags.push('price-200-300')
    else if (price < 500) result.tags.push('price-300-500')
    else result.tags.push('price-over-500')
  }
  
  // Add trending/popular tags for SEO
  if (combined.includes('sparkle') || combined.includes('sequin')) {
    result.tags.push('trending-prom-2025')
  }
  if (combined.includes('wedding')) {
    result.tags.push('wedding-season-2025')
  }
  
  // Default collections if none found
  if (result.collections.length === 0) {
    if (metadata?.pricing_tier?.includes('SUIT')) {
      result.collections.push('suits-and-tuxedos')
    } else if (metadata?.pricing_tier?.includes('ACCESSORY')) {
      result.collections.push('accessories')
    }
  }
  
  return result
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get sample products to show categorization
    const sampleProducts = await productModuleService.listProducts(
      {},
      { take: 10, select: ["id", "title", "handle", "metadata"] }
    )
    
    const samples = sampleProducts.map(product => ({
      title: product.title,
      handle: product.handle,
      ...analyzeProduct(product.title, product.handle, product.metadata)
    }))
    
    res.json({
      message: "Product categorization preview",
      total_collections: Object.keys(CATEGORIZATION_RULES.collections).length,
      total_categories: Object.keys(CATEGORIZATION_RULES.categories).length,
      samples,
      instructions: "POST to this endpoint with ?batch_size=X&offset=Y to apply categorization"
    })
    
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}

interface BatchRequest extends MedusaRequest {
  query: {
    batch_size?: string
    offset?: string
  }
}

export const POST = async (
  req: BatchRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    const batchSize = parseInt(req.query.batch_size || "10")
    const offset = parseInt(req.query.offset || "0")
    
    // Get batch of products
    const products = await productModuleService.listProducts(
      {},
      {
        take: batchSize,
        skip: offset,
        select: ["id", "title", "handle", "metadata"]
      }
    )
    
    if (products.length === 0) {
      return res.json({
        success: true,
        message: "No more products to process",
        batch_complete: true
      })
    }
    
    const results = {
      batch_size: batchSize,
      offset: offset,
      products_processed: 0,
      products_updated: [] as string[],
      errors: [] as any[]
    }
    
    // Process each product
    for (const product of products) {
      try {
        const categorization = analyzeProduct(product.title, product.handle, product.metadata)
        
        // Update product metadata with categorization
        const updatedMetadata = {
          ...product.metadata,
          collections: categorization.collections,
          categories: categorization.categories,
          tags: categorization.tags,
          seo_keywords: categorization.seo_keywords.join(', '),
          auto_categorized: true,
          categorized_at: new Date().toISOString()
        }
        
        await productModuleService.updateProducts(product.id, {
          metadata: updatedMetadata
        })
        
        results.products_processed++
        results.products_updated.push(product.title)
        
      } catch (error: any) {
        results.errors.push({
          product: product.title,
          error: error.message
        })
      }
    }
    
    // Check if there are more products
    const allProducts = await productModuleService.listProducts({}, { take: null })
    const hasMore = (offset + batchSize) < allProducts.length
    
    res.json({
      success: true,
      message: `Categorized batch ${Math.floor(offset / batchSize) + 1}`,
      results,
      progress: {
        current_offset: offset,
        next_offset: hasMore ? offset + batchSize : null,
        total_products: allProducts.length,
        products_remaining: Math.max(0, allProducts.length - (offset + batchSize)),
        percent_complete: Math.round(((offset + batchSize) / allProducts.length) * 100)
      },
      next_action: hasMore 
        ? `POST ?batch_size=${batchSize}&offset=${offset + batchSize}` 
        : "All products categorized!"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: "Categorization failed",
      message: error.message
    })
  }
}