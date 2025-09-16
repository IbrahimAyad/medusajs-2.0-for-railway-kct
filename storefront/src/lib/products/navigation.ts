// Product navigation utilities for consistent URL handling
// This ensures product links work correctly regardless of product source

import { router } from 'next/navigation';

export interface ProductLinkData {
  id?: string;
  handle?: string;
  slug?: string;
  title?: string;
  [key: string]: any;
}

/**
 * Get the correct product detail URL based on available product data
 * Handles both Medusa products and legacy products
 */
export function getProductUrl(product: ProductLinkData): string {
  // Priority 1: Use handle for Medusa products
  if (product.handle) {
    return `/products/medusa/${product.handle}`;
  }
  
  // Priority 2: Use slug (some products might have slug instead of handle)
  if (product.slug) {
    // Check if slug looks like a Medusa handle
    if (product.slug.includes('-')) {
      return `/products/medusa/${product.slug}`;
    }
    // Otherwise use the slug as-is
    return `/products/${product.slug}`;
  }
  
  // Priority 3: Generate slug from title if available
  if (product.title) {
    const generatedSlug = product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `/products/medusa/${generatedSlug}`;
  }
  
  // Priority 4: Use ID as last resort
  if (product.id) {
    return `/products/medusa/${product.id}`;
  }
  
  // Fallback to products page if no identifiers
  console.warn('Product has no identifiers for URL generation:', product);
  return '/products';
}

/**
 * Prefetch product data for faster navigation
 * This preloads the product page when user hovers
 */
export async function prefetchProduct(product: ProductLinkData) {
  const url = getProductUrl(product);
  
  // Use Next.js router prefetch
  try {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      // Prefetch during idle time for better performance
      requestIdleCallback(() => {
        // Store product data in session storage for instant loading
        const cacheKey = `product_prefetch_${product.id || product.handle || product.slug}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
          ...product,
          prefetchedAt: Date.now()
        }));
      });
    }
  } catch (error) {
    console.error('Error prefetching product:', error);
  }
}

/**
 * Get prefetched product data if available
 * This allows instant display while fresh data loads
 */
export function getPrefetchedProduct(identifier: string): any | null {
  try {
    const keys = [`product_prefetch_${identifier}`];
    
    for (const key of keys) {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is less than 5 minutes old
        if (Date.now() - data.prefetchedAt < 5 * 60 * 1000) {
          return data;
        }
        // Clean up old cache
        sessionStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error getting prefetched product:', error);
  }
  
  return null;
}

/**
 * Clear old prefetch cache to prevent storage bloat
 */
export function cleanPrefetchCache() {
  try {
    const now = Date.now();
    const keys = Object.keys(sessionStorage);
    
    keys.forEach(key => {
      if (key.startsWith('product_prefetch_')) {
        try {
          const data = JSON.parse(sessionStorage.getItem(key) || '{}');
          // Remove if older than 10 minutes
          if (now - data.prefetchedAt > 10 * 60 * 1000) {
            sessionStorage.removeItem(key);
          }
        } catch {
          // Remove corrupted entries
          sessionStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning prefetch cache:', error);
  }
}