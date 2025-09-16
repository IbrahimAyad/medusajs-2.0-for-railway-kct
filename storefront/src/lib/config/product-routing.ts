/**
 * Product Routing Configuration
 * Defines which routes are core products (hardcoded with Stripe) vs Medusa products
 */

// Core product route patterns - these should NEVER go to Medusa
export const CORE_PRODUCT_ROUTES = {
  // Ties - 80+ colors with 4 variations each
  ties: {
    collection: '/collections/ties',
    detail: '/collections/ties/[color]', // e.g., /collections/ties/ivory
    patterns: [
      /^\/collections\/ties$/,
      /^\/collections\/ties\/[^\/]+$/
    ]
  },
  
  // Suits - Core colors with 2P/3P options
  suits: {
    collection: '/products/suits',
    detail: '/products/suits/[id]', // e.g., /products/suits/prod_xxx
    patterns: [
      /^\/products\/suits$/,
      /^\/products\/suits\/[^\/]+$/
    ]
  },
  
  // Dress Shirts - Multiple colors with Slim/Classic fit
  dressShirts: {
    collection: '/collections/dress-shirts',
    detail: '/collections/dress-shirts/[color]', // e.g., /collections/dress-shirts/black
    patterns: [
      /^\/collections\/dress-shirts$/,
      /^\/collections\/dress-shirts\/[^\/]+$/,
      /^\/products\/dress-shirts$/,
      /^\/products\/dress-shirts\/[^\/]+$/
    ]
  },
  
  // Bundles - Pre-made combinations
  bundles: {
    collection: '/bundles',
    detail: '/bundles/[id]', // e.g., /bundles/wedding-fall-002
    patterns: [
      /^\/bundles$/,
      /^\/bundles\/[^\/]+$/
    ]
  },
  
  // Custom Suits - Bundle builder
  customSuits: {
    page: '/custom-suits',
    patterns: [
      /^\/custom-suits$/
    ]
  },
  
  // Occasions - Bundle collections
  occasions: {
    collection: '/occasions',
    detail: '/occasions/[occasion]',
    patterns: [
      /^\/occasions$/,
      /^\/occasions\/[^\/]+$/
    ]
  }
}

// Helper function to check if a path is a core product route
export function isCoreProductRoute(pathname: string): boolean {
  for (const route of Object.values(CORE_PRODUCT_ROUTES)) {
    for (const pattern of route.patterns) {
      if (pattern.test(pathname)) {
        return true
      }
    }
  }
  return false
}

// Helper function to get product type from route
export function getCoreProductType(pathname: string): string | null {
  for (const [type, route] of Object.entries(CORE_PRODUCT_ROUTES)) {
    for (const pattern of route.patterns) {
      if (pattern.test(pathname)) {
        return type
      }
    }
  }
  return null
}

// Medusa product routes - everything else in /products and /shop
export const MEDUSA_PRODUCT_ROUTES = {
  shop: '/shop',
  products: '/products/[handle]', // Catch-all for non-core products
  patterns: [
    /^\/shop/,
    /^\/shop-medusa/,
    /^\/kct-shop/,
    // Only match /products/[handle] if it's NOT a core product
    /^\/products\/(?!suits|dress-shirts|ties|tuxedos)[^\/]+$/
  ]
}

// Helper function to check if a path is a Medusa product route
export function isMedusaProductRoute(pathname: string): boolean {
  // First check if it's a core route - core takes precedence
  if (isCoreProductRoute(pathname)) {
    return false
  }
  
  // Then check if it matches Medusa patterns
  for (const pattern of MEDUSA_PRODUCT_ROUTES.patterns) {
    if (pattern.test(pathname)) {
      return true
    }
  }
  
  return false
}

// Cart type determination based on product ID
export function isCoreProductId(productId: string): boolean {
  // Core product IDs patterns
  const corePatterns = [
    /^suit-/,          // suit-navy-2p, suit-navy-3p
    /^tie-/,           // tie-ivory-classic
    /^shirt-/,         // shirt-white-slim
    /^bundle-/,        // bundle-wedding-001
    /^core-/,          // Any explicitly marked core product
  ]
  
  return corePatterns.some(pattern => pattern.test(productId))
}

// Determine which checkout to use based on cart contents
export function getCheckoutType(cartItems: any[]): 'core' | 'medusa' | 'mixed' {
  const hasCoreProducts = cartItems.some(item => isCoreProductId(item.productId || item.id))
  const hasMedusaProducts = cartItems.some(item => !isCoreProductId(item.productId || item.id))
  
  if (hasCoreProducts && hasMedusaProducts) {
    return 'mixed'
  } else if (hasCoreProducts) {
    return 'core'
  } else {
    return 'medusa'
  }
}