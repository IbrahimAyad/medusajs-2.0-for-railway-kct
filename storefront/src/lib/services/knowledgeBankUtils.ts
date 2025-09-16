/**
 * Knowledge Bank Utility Functions
 * Ensures proper request formatting and response handling
 */

import { getProductPrice } from '@/utils/pricing';

/**
 * Build a properly formatted product payload for Knowledge Bank API
 */
export function buildProductPayload(product: any) {
  // Ensure we have a valid product object
  if (!product) {
    return {
      id: 'unknown',
      name: 'Unknown Product',
      color: 'unknown',
      category: 'general',
      price: 0
    };
  }

  // Extract product information safely
  const id = product.id || 'unknown';
  const name = product.title || product.name || 'Unknown Product';
  const color = extractProductColor(product) || 'unknown';
  const category = extractProductCategory(product) || 'general';
  const price = getProductPrice(product) || 0;

  return {
    id,
    name,
    color,
    category,
    price,
    // Include additional metadata if available
    metadata: {
      description: product.description || '',
      tags: product.tags || [],
      slug: product.handle || product.slug || ''
    }
  };
}

/**
 * Extract color from product safely
 */
export function extractProductColor(product: any): string {
  if (!product) return 'unknown';

  // Check various possible color fields
  const title = (product.title || product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
  
  // Common colors to check for
  const colors = [
    'navy', 'black', 'grey', 'gray', 'charcoal', 'blue', 'brown',
    'burgundy', 'red', 'green', 'white', 'cream', 'beige', 'tan',
    'pink', 'purple', 'sage', 'olive', 'emerald', 'indigo', 'powder'
  ];

  // Check title first (most likely place)
  for (const color of colors) {
    if (title.includes(color)) return color;
  }

  // Then check tags
  for (const color of colors) {
    if (tags.includes(color)) return color;
  }

  // Finally check description
  for (const color of colors) {
    if (description.includes(color)) return color;
  }

  return 'classic'; // Default fallback
}

/**
 * Extract category from product safely
 */
export function extractProductCategory(product: any): string {
  if (!product) return 'general';

  const title = (product.title || product.name || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  
  // Check for specific categories
  if (title.includes('suit') || category.includes('suit')) return 'suits';
  if (title.includes('tuxedo') || category.includes('tuxedo')) return 'tuxedos';
  if (title.includes('blazer') || category.includes('blazer')) return 'blazers';
  if (title.includes('shirt') || category.includes('shirt')) return 'shirts';
  if (title.includes('tie') || category.includes('tie')) return 'ties';
  if (title.includes('vest') || category.includes('vest')) return 'vests';
  if (title.includes('shoe') || category.includes('shoe')) return 'shoes';
  if (title.includes('bow') || category.includes('bow')) return 'bowties';
  
  return 'general';
}

/**
 * Build complete-the-look request payload
 */
export function buildCompleteTheLookPayload(product: any, options: any = {}) {
  const productPayload = buildProductPayload(product);
  
  return {
    product: productPayload,
    productName: productPayload.name,
    productType: productPayload.category,
    color: productPayload.color,
    occasion: options.occasion || 'general',
    season: options.season || getCurrentSeason(),
    preferences: {
      priceRange: options.priceRange || [0, 1000],
      style: options.style || 'classic'
    }
  };
}

/**
 * Build recommendations request payload
 */
export function buildRecommendationsPayload(options: any = {}) {
  return {
    occasion: options.occasion || 'general',
    season: options.season || getCurrentSeason(),
    styleProfile: options.styleProfile || 'classic',
    budget: options.budget || { min: 0, max: 1000 },
    excludeColors: options.excludeColors || [],
    // Include product context if available
    product: options.product ? buildProductPayload(options.product) : undefined
  };
}

/**
 * Get current season
 */
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any): boolean {
  if (!response) return false;
  
  // Check for success flag
  if (response.success === false) {
    console.warn('API returned success: false', response.error);
    return false;
  }
  
  // Check for data property
  if (!response.data && !response.recommendations) {
    console.warn('API response missing data property');
    return false;
  }
  
  return true;
}

/**
 * Extract data from API response safely
 */
export function extractApiData(response: any, dataPath: string) {
  if (!response) return null;
  
  // Handle nested structure { success, data: { [dataPath]: value } }
  if (response.data && response.data[dataPath] !== undefined) {
    return response.data[dataPath];
  }
  
  // Handle direct structure { [dataPath]: value }
  if (response[dataPath] !== undefined) {
    return response[dataPath];
  }
  
  // Handle deeply nested paths
  const parts = dataPath.split('.');
  let current = response;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Safe array slice with validation
 */
export function safeSlice<T>(array: T[] | undefined | null, start: number, end?: number): T[] {
  if (!Array.isArray(array)) return [];
  return array.slice(start, end);
}

/**
 * Safe array map with validation
 */
export function safeMap<T, R>(
  array: T[] | undefined | null,
  callback: (item: T, index: number) => R
): R[] {
  if (!Array.isArray(array)) return [];
  return array.map(callback);
}