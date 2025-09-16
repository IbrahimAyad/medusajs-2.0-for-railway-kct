/**
 * KCT Menswear Pricing System - Robust price extraction
 * Handles various data structures from backend
 */

/**
 * Extract price from various possible locations in product/variant data
 * @param data - Any object that might contain price data
 * @returns Price in cents or null if not found
 */
const extractPriceInCents = (data: any): number | null => {
  if (!data) return null
  
  // Check calculated_price.calculated_amount (standard Medusa v2)
  if (data.calculated_price?.calculated_amount !== undefined && data.calculated_price.calculated_amount !== null) {
    return Number(data.calculated_price.calculated_amount)
  }
  
  // Check calculated_price.amount (alternative structure)
  if (data.calculated_price?.amount !== undefined && data.calculated_price.amount !== null) {
    return Number(data.calculated_price.amount)
  }
  
  // Check direct price field (some products might have this)
  if (data.price !== undefined && data.price !== null) {
    // If price is already in dollars (less than 1000), convert to cents
    const price = Number(data.price)
    if (price < 1000) {
      return price * 100
    }
    return price
  }
  
  // Check prices array (legacy structure)
  if (Array.isArray(data.prices) && data.prices.length > 0) {
    const firstPrice = data.prices[0]
    if (firstPrice?.amount !== undefined && firstPrice.amount !== null) {
      return Number(firstPrice.amount)
    }
  }
  
  // Check metadata for tier_price (some products might still have this)
  if (data.metadata?.tier_price !== undefined && data.metadata.tier_price !== null) {
    // tier_price is in dollars, convert to cents
    return Number(data.metadata.tier_price) * 100
  }
  
  return null
}

/**
 * Get the price from a product or variant
 * Searches multiple possible locations for price data
 * @param productOrVariant - Product or Variant object from Medusa API
 * @returns Price in dollars (converted from cents)
 */
export const getProductPrice = (productOrVariant: any): string => {
  try {
    // Try direct extraction
    let priceInCents = extractPriceInCents(productOrVariant)
    
    // If not found, try variants array
    if (priceInCents === null && productOrVariant?.variants?.length > 0) {
      priceInCents = extractPriceInCents(productOrVariant.variants[0])
    }
    
    // If not found, try single variant property
    if (priceInCents === null && productOrVariant?.variant) {
      priceInCents = extractPriceInCents(productOrVariant.variant)
    }
    
    // If we found a price, convert and return
    if (priceInCents !== null && !isNaN(priceInCents)) {
      const priceInDollars = priceInCents / 100
      return priceInDollars.toFixed(2)
    }
    
    // Log warning for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.warn('Could not extract price from:', productOrVariant)
    }
    
    return '0.00'
  } catch (error) {
    console.error('Error in getProductPrice:', error)
    return '0.00'
  }
}

/**
 * Get price as a number (for calculations)
 * @param productOrVariant - Product or Variant object
 * @returns Price as number in dollars
 */
export const getProductPriceAsNumber = (productOrVariant: any): number => {
  const priceString = getProductPrice(productOrVariant)
  const price = parseFloat(priceString)
  return isNaN(price) ? 0 : price
}

/**
 * Format price amount in cents to dollars
 * @param amountInCents - Price in cents
 * @returns Formatted price string
 */
export const formatPrice = (amountInCents: number | string | undefined | null): string => {
  try {
    const cents = Number(amountInCents)
    if (isNaN(cents)) return '0.00'
    return (cents / 100).toFixed(2)
  } catch {
    return '0.00'
  }
}

/**
 * Safely format any price value for display
 * @param price - Price in any format (cents, dollars, string, etc)
 * @returns Formatted price string with dollar sign
 */
export const formatDisplayPrice = (price: any): string => {
  // If it's already a formatted string with $, return it
  if (typeof price === 'string' && price.startsWith('$')) {
    return price
  }
  
  // Try to extract and format the price
  const priceStr = typeof price === 'object' ? getProductPrice(price) : String(price)
  const numPrice = parseFloat(priceStr)
  
  if (isNaN(numPrice)) return '$0.00'
  
  // If the number is large (likely cents), convert to dollars
  if (numPrice > 1000) {
    return `$${(numPrice / 100).toFixed(2)}`
  }
  
  // Otherwise assume it's already in dollars
  return `$${numPrice.toFixed(2)}`
}

/**
 * Check if a variant is available (for our system, always true)
 */
export const isVariantAvailable = (variant: any): boolean => {
  // All products have manage_inventory = false (unlimited stock)
  return true
}

/**
 * Check if any variant of a product is available (always true for us)
 */
export const isProductAvailable = (product: any): boolean => {
  // All products have manage_inventory = false (unlimited stock)
  return true
}