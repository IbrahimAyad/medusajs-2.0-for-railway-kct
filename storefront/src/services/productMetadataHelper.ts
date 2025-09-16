// Helper to extract metadata from product fields when metadata is not available
import { MedusaProduct } from './medusaBackendService'

// Map product to collections based on handle, title, and category
export function extractCollectionFromProduct(product: MedusaProduct): string[] {
  const collections: string[] = []
  
  const title = product.title?.toLowerCase() || ''
  const handle = product.handle?.toLowerCase() || ''
  const description = product.description?.toLowerCase() || ''
  const pricingTier = product.pricing_tier?.toLowerCase() || ''
  
  // Check for suits & tuxedos
  if (title.includes('suit') || title.includes('tuxedo') || 
      handle.includes('suit') || handle.includes('tuxedo') ||
      pricingTier.includes('suit') || pricingTier.includes('tuxedo')) {
    collections.push('suits-tuxedos')
  }
  
  // Check for wedding
  if (title.includes('wedding') || handle.includes('wedding') || 
      description.includes('wedding') || title.includes('groom')) {
    collections.push('wedding')
  }
  
  // Check for prom
  if (title.includes('prom') || handle.includes('prom') || 
      description.includes('prom') || title.includes('sparkle') || 
      title.includes('floral')) {
    collections.push('prom')
  }
  
  // Check for accessories
  if (title.includes('vest') || title.includes('tie') || 
      title.includes('bowtie') || title.includes('cufflink') ||
      title.includes('suspender') || title.includes('pocket square') ||
      handle.includes('vest') || handle.includes('tie') ||
      pricingTier.includes('vest') || pricingTier.includes('tie')) {
    collections.push('accessories')
  }
  
  // Check for outerwear
  if (title.includes('coat') || title.includes('jacket') || 
      title.includes('blazer') || title.includes('overcoat') ||
      handle.includes('coat') || handle.includes('jacket')) {
    collections.push('outerwear')
  }
  
  // Check for footwear
  if (title.includes('shoe') || title.includes('oxford') || 
      title.includes('loafer') || title.includes('boot') ||
      handle.includes('shoe') || handle.includes('footwear')) {
    collections.push('footwear')
  }
  
  return collections
}

// Extract color from product title/handle
export function extractColorsFromProduct(product: MedusaProduct): string[] {
  const colors: string[] = []
  const text = `${product.title} ${product.handle}`.toLowerCase()
  
  const colorMap: { [key: string]: string[] } = {
    'black': ['black', 'charcoal', 'ebony'],
    'navy': ['navy', 'midnight', 'dark blue'],
    'gray': ['gray', 'grey', 'silver', 'ash'],
    'brown': ['brown', 'tan', 'khaki', 'beige', 'camel'],
    'blue': ['blue', 'royal', 'cobalt', 'sapphire'],
    'burgundy': ['burgundy', 'wine', 'maroon', 'crimson'],
    'green': ['green', 'olive', 'emerald', 'sage', 'hunter'],
    'white': ['white', 'ivory', 'cream'],
    'red': ['red', 'crimson', 'scarlet'],
    'purple': ['purple', 'plum', 'violet', 'lavender'],
    'gold': ['gold', 'champagne', 'metallic']
  }
  
  for (const [mainColor, variations] of Object.entries(colorMap)) {
    if (variations.some(v => text.includes(v))) {
      colors.push(mainColor)
    }
  }
  
  return colors
}

// Extract price range from product
export function extractPriceRange(product: MedusaProduct): string | null {
  const price = (product.price || 0) / 100 // Convert cents to dollars
  
  if (price < 100) return 'under-100'
  if (price < 200) return '100-200'
  if (price < 300) return '200-300'
  return '300-plus'
}

// Extract occasions from product
export function extractOccasionsFromProduct(product: MedusaProduct): string[] {
  const occasions: string[] = []
  const text = `${product.title} ${product.handle} ${product.description}`.toLowerCase()
  
  if (text.includes('wedding') || text.includes('groom')) occasions.push('wedding')
  if (text.includes('prom') || text.includes('dance')) occasions.push('prom')
  if (text.includes('business') || text.includes('professional')) occasions.push('business')
  if (text.includes('formal') || text.includes('black tie')) occasions.push('formal')
  if (text.includes('casual') || text.includes('everyday')) occasions.push('casual')
  
  return occasions
}

// Extract style from product
export function extractStyleFromProduct(product: MedusaProduct): string[] {
  const styles: string[] = []
  const text = `${product.title} ${product.handle}`.toLowerCase()
  
  if (text.includes('slim') || text.includes('fitted')) styles.push('slim-fit')
  if (text.includes('modern')) styles.push('modern-fit')
  if (text.includes('classic') || text.includes('traditional')) styles.push('classic-fit')
  if (text.includes('double breasted') || text.includes('double-breasted')) styles.push('double-breasted')
  if (text.includes('regular')) styles.push('regular-fit')
  
  return styles
}

// Check if product is in stock
export function isProductInStock(product: MedusaProduct): boolean {
  if (!product.variants || product.variants.length === 0) return false
  return product.variants.some(v => v.inventory_quantity > 0)
}