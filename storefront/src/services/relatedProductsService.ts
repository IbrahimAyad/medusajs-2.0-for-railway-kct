import { MedusaProduct } from './medusaBackendService'
import { parseMetadataField } from './medusaProductService'

// Find related products based on metadata
export function findRelatedProducts(
  currentProduct: MedusaProduct,
  allProducts: MedusaProduct[],
  limit: number = 8
): MedusaProduct[] {
  if (!currentProduct || !allProducts.length) return []
  
  // Get current product metadata
  const currentCollections = parseMetadataField(currentProduct.metadata?.collections as string)
  const currentCategories = parseMetadataField(currentProduct.metadata?.categories as string)
  const currentStyles = parseMetadataField(currentProduct.metadata?.styles as string)
  const currentColors = parseMetadataField(currentProduct.metadata?.colors as string)
  const currentOccasions = parseMetadataField(currentProduct.metadata?.occasions as string)
  const currentTags = parseMetadataField(currentProduct.metadata?.tags as string)
  
  // Score each product
  const scoredProducts = allProducts
    .filter(p => p.id !== currentProduct.id) // Exclude current product
    .map(product => {
      let score = 0
      
      // Parse product metadata
      const collections = parseMetadataField(product.metadata?.collections as string)
      const categories = parseMetadataField(product.metadata?.categories as string)
      const styles = parseMetadataField(product.metadata?.styles as string)
      const colors = parseMetadataField(product.metadata?.colors as string)
      const occasions = parseMetadataField(product.metadata?.occasions as string)
      const tags = parseMetadataField(product.metadata?.tags as string)
      
      // Score based on matching metadata (weighted)
      
      // Same collection = highest score
      collections.forEach(c => {
        if (currentCollections.includes(c)) score += 10
      })
      
      // Same category = high score
      categories.forEach(c => {
        if (currentCategories.includes(c)) score += 8
      })
      
      // Same style = good score
      styles.forEach(s => {
        if (currentStyles.includes(s)) score += 6
      })
      
      // Same occasion = good score
      occasions.forEach(o => {
        if (currentOccasions.includes(o)) score += 5
      })
      
      // Same tags = medium score
      tags.forEach(t => {
        if (currentTags.includes(t)) score += 3
      })
      
      // Same color family = lower score (variety is good)
      colors.forEach(c => {
        if (currentColors.includes(c)) score += 1
      })
      
      // Price similarity bonus
      const currentPrice = (currentProduct.price || 0) / 100 // Convert cents to dollars
      const productPrice = (product.price || 0) / 100 // Convert cents to dollars
      const priceDiff = Math.abs(currentPrice - productPrice)
      
      if (priceDiff < 50) score += 4
      else if (priceDiff < 100) score += 2
      
      return { product, score }
    })
    .filter(item => item.score > 0) // Only keep products with some relation
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit)
    .map(item => item.product)
  
  // If we don't have enough related products, add some from the same price range
  if (scoredProducts.length < limit) {
    const currentPrice = (currentProduct.price || 0) / 100 // Convert cents to dollars
    
    const similarPriceProducts = allProducts
      .filter(p => {
        // Not already included and not the current product
        if (p.id === currentProduct.id || scoredProducts.some(sp => sp.id === p.id)) {
          return false
        }
        
        const productPrice = (p.price || 0) / 100 // Convert cents to dollars
        const priceDiff = Math.abs(currentPrice - productPrice)
        return priceDiff < 100 // Within $100 price range
      })
      .slice(0, limit - scoredProducts.length)
    
    scoredProducts.push(...similarPriceProducts)
  }
  
  return scoredProducts
}

// Get complementary products (items that go well together)
export function getComplementaryProducts(
  currentProduct: MedusaProduct,
  allProducts: MedusaProduct[],
  limit: number = 4
): MedusaProduct[] {
  if (!currentProduct || !allProducts.length) return []
  
  const currentCategories = parseMetadataField(currentProduct.metadata?.categories as string)
  const currentOccasions = parseMetadataField(currentProduct.metadata?.occasions as string)
  
  // Define complementary category mappings
  const complementaryMap: { [key: string]: string[] } = {
    'suits': ['shirts', 'ties', 'accessories', 'shoes'],
    'shirts': ['ties', 'suits', 'accessories'],
    'ties': ['shirts', 'suits', 'accessories'],
    'shoes': ['suits', 'accessories'],
    'accessories': ['suits', 'shirts', 'ties'],
    'blazers': ['shirts', 'ties', 'accessories'],
    'tuxedos': ['shirts', 'bowties', 'accessories'],
  }
  
  // Find what complements the current product
  let targetCategories: string[] = []
  
  currentCategories.forEach(cat => {
    const catLower = cat.toLowerCase()
    Object.keys(complementaryMap).forEach(key => {
      if (catLower.includes(key)) {
        targetCategories.push(...complementaryMap[key])
      }
    })
  })
  
  // If no specific mapping, suggest different categories
  if (targetCategories.length === 0) {
    targetCategories = ['suits', 'shirts', 'ties', 'accessories']
  }
  
  // Find products that match complementary categories
  const complementaryProducts = allProducts
    .filter(p => {
      if (p.id === currentProduct.id) return false
      
      const categories = parseMetadataField(p.metadata?.categories as string)
      const occasions = parseMetadataField(p.metadata?.occasions as string)
      
      // Must be in a complementary category
      const inComplementaryCategory = categories.some(c => 
        targetCategories.some(tc => c.toLowerCase().includes(tc))
      )
      
      // Bonus if same occasion
      const sameOccasion = occasions.some(o => currentOccasions.includes(o))
      
      return inComplementaryCategory || sameOccasion
    })
    .slice(0, limit)
  
  return complementaryProducts
}

// Get frequently bought together products
export function getFrequentlyBoughtTogether(
  currentProduct: MedusaProduct,
  allProducts: MedusaProduct[],
  limit: number = 3
): MedusaProduct[] {
  // For now, this combines related and complementary products
  // In a real system, this would use order history data
  
  const related = findRelatedProducts(currentProduct, allProducts, 2)
  const complementary = getComplementaryProducts(currentProduct, allProducts, limit - related.length)
  
  return [...related, ...complementary].slice(0, limit)
}