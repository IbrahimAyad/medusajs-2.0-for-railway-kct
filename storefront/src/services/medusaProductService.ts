// Optimized Medusa Product Service with Metadata Filtering
// Uses the new categorization system for better performance

import { MedusaProduct } from './medusaBackendService'
import { medusaProductCache } from './medusaProductCache'

const MEDUSA_URL = 'https://backend-production-7441.up.railway.app'

// Get API headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-publishable-api-key': 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'
  }
}

// Parse comma-separated metadata fields into arrays
export function parseMetadataField(field: string | undefined): string[] {
  if (!field) return []
  return field.split(',').map(item => item.trim()).filter(Boolean)
}

import { 
  extractCollectionFromProduct, 
  extractColorsFromProduct,
  extractOccasionsFromProduct,
  extractStyleFromProduct,
  extractPriceRange
} from './productMetadataHelper'

// Extract collections from product
export function getProductCollections(product: MedusaProduct): string[] {
  // First try metadata, then fall back to extraction
  const metadataCollections = parseMetadataField(product.metadata?.collections)
  if (metadataCollections.length > 0) return metadataCollections
  return extractCollectionFromProduct(product)
}

// Extract tags from product
export function getProductTags(product: MedusaProduct): string[] {
  // First try metadata, then fall back to extraction
  const metadataTags = parseMetadataField(product.metadata?.tags)
  if (metadataTags.length > 0) return metadataTags
  
  // Generate tags from product attributes
  const tags: string[] = []
  const colors = extractColorsFromProduct(product)
  colors.forEach(color => tags.push(`color-${color}`))
  return tags
}

// Extract categories from product
export function getProductCategories(product: MedusaProduct): string[] {
  // First try metadata, then fall back to extraction from collections
  const metadataCategories = parseMetadataField(product.metadata?.categories)
  if (metadataCategories.length > 0) return metadataCategories
  
  // Use collections as categories
  return getProductCollections(product)
}

// Filter options configuration
export const FILTER_OPTIONS = {
  collections: [
    { value: 'suits-tuxedos', label: 'Suits & Tuxedos', icon: '🤵' },
    { value: 'wedding', label: 'Wedding Collection', icon: '💒' },
    { value: 'prom', label: 'Prom Collection', icon: '🎉' },
    { value: 'accessories', label: 'Accessories', icon: '👔' },
    { value: 'outerwear', label: 'Outerwear', icon: '🧥' },
    { value: 'footwear', label: 'Footwear', icon: '👞' }
  ],
  
  colors: [
    { value: 'color-black', label: 'Black', hex: '#000000' },
    { value: 'color-navy', label: 'Navy', hex: '#000080' },
    { value: 'color-gray', label: 'Gray', hex: '#808080' },
    { value: 'color-blue', label: 'Blue', hex: '#0000FF' },
    { value: 'color-brown', label: 'Brown', hex: '#8B4513' },
    { value: 'color-white', label: 'White', hex: '#FFFFFF' },
    { value: 'color-burgundy', label: 'Burgundy', hex: '#800020' },
    { value: 'color-mint', label: 'Mint', hex: '#98FF98' },
    { value: 'color-red', label: 'Red', hex: '#FF0000' },
    { value: 'color-green', label: 'Green', hex: '#008000' },
    { value: 'color-gold', label: 'Gold', hex: '#FFD700' }
  ],
  
  priceRanges: [
    { value: 'under-100', label: 'Under $100', min: 0, max: 100 },
    { value: '100-200', label: '$100 - $200', min: 100, max: 200 },
    { value: '200-300', label: '$200 - $300', min: 200, max: 300 },
    { value: '300-plus', label: 'Over $300', min: 300, max: 9999 }
  ],
  
  occasions: [
    { value: 'wedding', label: 'Wedding' },
    { value: 'prom', label: 'Prom' },
    { value: 'business', label: 'Business' },
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' }
  ],
  
  styles: [
    { value: 'slim-fit', label: 'Slim Fit' },
    { value: 'modern-fit', label: 'Modern Fit' },
    { value: 'classic-fit', label: 'Classic Fit' },
    { value: 'double-breasted', label: 'Double Breasted' }
  ]
}

// Active filters interface
export interface ActiveFilters {
  collection?: string
  colors?: string[]
  priceRange?: string
  occasion?: string
  style?: string
  search?: string
  inStock?: boolean
}

// Filter products based on active filters
export function filterProducts(products: MedusaProduct[], filters: ActiveFilters): MedusaProduct[] {
  return products.filter(product => {
    // Collection filter
    if (filters.collection) {
      const collections = getProductCollections(product)
      if (!collections.includes(filters.collection)) return false
    }
    
    // Color filter (can be multiple)
    if (filters.colors && filters.colors.length > 0) {
      const productColors = extractColorsFromProduct(product)
      const hasColor = filters.colors.some(color => productColors.includes(color))
      if (!hasColor) return false
    }
    
    // Price range filter
    if (filters.priceRange) {
      const price = product.price || 0 // Backend will provide actual price in cents, convert to dollars for range check
      const priceInDollars = price / 100
      const [min, max] = filters.priceRange.split('-').map(p => 
        p === 'plus' ? Infinity : parseInt(p)
      )
      if (priceInDollars < min || (max !== Infinity && priceInDollars > max)) return false
    }
    
    // Occasion filter
    if (filters.occasion) {
      const occasions = extractOccasionsFromProduct(product)
      if (!occasions.includes(filters.occasion)) return false
    }
    
    // Style filter
    if (filters.style) {
      const styles = extractStyleFromProduct(product)
      if (!styles.includes(filters.style)) return false
    }
    
    // In stock filter
    if (filters.inStock) {
      const hasStock = product.variants?.some(v => (v.inventory_quantity || 0) > 0)
      if (!hasStock) return false
    }
    
    // Search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        product.title.toLowerCase().includes(searchLower) ||
        product.handle?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.metadata?.seo_keywords?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }
    
    return true
  })
}

// Fetch products by collection (optimized)
export async function fetchProductsByCollection(collection: string): Promise<MedusaProduct[]> {
  // Check cache first
  const cacheKey = `collection_${collection}`
  const cached = medusaProductCache.getByKey(cacheKey)
  if (cached) return cached
  
  try {
    // Fetch all products (will be optimized when backend supports collection filtering)
    const response = await fetch(`${MEDUSA_URL}/store/products?limit=250`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`)
    }
    
    const data = await response.json()
    const allProducts = data.products || []
    
    // Filter by collection on client side (temporary until backend supports it)
    const filteredProducts = allProducts.filter((product: MedusaProduct) => {
      const collections = getProductCollections(product)
      return collections.includes(collection)
    })
    
    // Cache the filtered results
    medusaProductCache.setByKey(cacheKey, filteredProducts)
    
    return filteredProducts
  } catch (error) {
    console.error('Error fetching products by collection:', error)
    return []
  }
}

// Get color hex value
export function getColorHex(colorName: string): string {
  const color = FILTER_OPTIONS.colors.find(c => 
    c.value === `color-${colorName}` || c.label.toLowerCase() === colorName.toLowerCase()
  )
  return color?.hex || '#808080' // Default to gray if not found
}

// Format tag for display
export function formatTag(tag: string): string {
  // Remove prefixes and format
  const formatted = tag
    .replace('color-', '')
    .replace('occasion-', '')
    .replace('-', ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
  
  return formatted
}

// Get product stock status
export function getProductStock(product: MedusaProduct): {
  inStock: boolean
  totalQuantity: number
  message: string
} {
  const quantities = product.variants?.map(v => v.inventory_quantity || 0) || []
  const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0)
  const inStock = totalQuantity > 0
  
  let message = 'Out of Stock'
  if (totalQuantity > 10) {
    message = 'In Stock'
  } else if (totalQuantity > 0) {
    message = `Only ${totalQuantity} left`
  }
  
  return { inStock, totalQuantity, message }
}

// Get price range for a collection
export function getCollectionPriceRange(products: MedusaProduct[]): {
  min: number
  max: number
} {
  const prices = products
    .map(p => (p.price || 0) / 100) // Convert cents to dollars
    .filter(price => price > 0)
  
  if (prices.length === 0) {
    return { min: 0, max: 0 }
  }
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  }
}

// Sort products
export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'popular'

export function sortProducts(products: MedusaProduct[], sortBy: SortOption): MedusaProduct[] {
  const sorted = [...products]
  
  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => 
        (a.price || 0) - (b.price || 0)
      )
    
    case 'price-desc':
      return sorted.sort((a, b) => 
        (b.price || 0) - (a.price || 0)
      )
    
    case 'name-asc':
      return sorted.sort((a, b) => 
        a.title.localeCompare(b.title)
      )
    
    case 'name-desc':
      return sorted.sort((a, b) => 
        b.title.localeCompare(a.title)
      )
    
    case 'popular':
      // Could use view count or sales data if available
      return sorted
    
    case 'newest':
    default:
      // Assuming products are returned newest first from API
      return sorted
  }
}

// Get related products (same collection or similar tags)
export function getRelatedProducts(
  product: MedusaProduct, 
  allProducts: MedusaProduct[], 
  limit: number = 4
): MedusaProduct[] {
  const productCollections = getProductCollections(product)
  const productTags = getProductTags(product)
  
  // Score each product by similarity
  const scoredProducts = allProducts
    .filter(p => p.id !== product.id) // Exclude current product
    .map(p => {
      let score = 0
      
      // Collection match (highest weight)
      const collections = getProductCollections(p)
      collections.forEach(c => {
        if (productCollections.includes(c)) score += 3
      })
      
      // Tag matches
      const tags = getProductTags(p)
      tags.forEach(t => {
        if (productTags.includes(t)) score += 1
      })
      
      return { product: p, score }
    })
    .filter(item => item.score > 0) // Must have some relation
    .sort((a, b) => b.score - a.score) // Sort by score
    .slice(0, limit)
    .map(item => item.product)
  
  return scoredProducts
}