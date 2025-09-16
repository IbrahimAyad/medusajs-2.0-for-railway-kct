// Progressive loading service for Medusa products
// Loads products in batches for better perceived performance

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

export interface LoadMoreResult {
  products: MedusaProduct[]
  hasMore: boolean
  total: number
}

// Progressive loader with batching
export class MedusaProgressiveLoader {
  private loadedProducts: MedusaProduct[] = []
  private currentOffset: number = 0
  private batchSize: number = 40
  private totalProducts: number | null = null
  private isLoading: boolean = false

  constructor(batchSize: number = 40) {
    this.batchSize = batchSize
  }

  // Reset loader state
  reset() {
    this.loadedProducts = []
    this.currentOffset = 0
    this.totalProducts = null
    this.isLoading = false
  }

  // Get all loaded products
  getLoadedProducts(): MedusaProduct[] {
    return [...this.loadedProducts]
  }

  // Load initial batch (fastest)
  async loadInitialBatch(): Promise<LoadMoreResult> {
    console.time('[Progressive] Initial batch load')
    
    // Check cache first for initial batch
    const cacheKey = `products_${this.batchSize}_0`
    const cached = medusaProductCache.getByKey(cacheKey)
    
    if (cached) {
      console.log(`[Progressive] Cache hit for initial ${this.batchSize} products`)
      this.loadedProducts = cached
      this.currentOffset = this.batchSize
      console.timeEnd('[Progressive] Initial batch load')
      
      return {
        products: cached,
        hasMore: true, // Assume more exist
        total: cached.length
      }
    }

    // Load from API if not cached
    try {
      const params = new URLSearchParams({
        limit: this.batchSize.toString(),
        offset: '0',
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD', // Include region for proper pricing
        fields: '*variants.calculated_price' // Request price data
      })
      
      const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }

      const data = await response.json()
      const products = data.products || []
      
      // Cache the initial batch
      medusaProductCache.setByKey(cacheKey, products)
      
      this.loadedProducts = products
      this.currentOffset = this.batchSize
      this.totalProducts = data.count || products.length
      
      console.timeEnd('[Progressive] Initial batch load')
      console.log(`[Progressive] Loaded ${products.length} products initially`)
      
      return {
        products,
        hasMore: products.length === this.batchSize,
        total: this.totalProducts
      }
    } catch (error) {
      console.error('[Progressive] Failed to load initial batch:', error)
      console.timeEnd('[Progressive] Initial batch load')
      return { products: [], hasMore: false, total: 0 }
    }
  }

  // Load more products (for infinite scroll)
  async loadMore(): Promise<LoadMoreResult> {
    if (this.isLoading) {
      return { 
        products: this.loadedProducts, 
        hasMore: false, 
        total: this.totalProducts || 0 
      }
    }

    this.isLoading = true
    console.time(`[Progressive] Load batch at offset ${this.currentOffset}`)

    try {
      // Check cache for this batch
      const cacheKey = `products_${this.batchSize}_${this.currentOffset}`
      const cached = medusaProductCache.getByKey(cacheKey)
      
      if (cached) {
        console.log(`[Progressive] Cache hit for batch at offset ${this.currentOffset}`)
        this.loadedProducts = [...this.loadedProducts, ...cached]
        this.currentOffset += cached.length
        this.isLoading = false
        console.timeEnd(`[Progressive] Load batch at offset ${this.currentOffset - cached.length}`)
        
        return {
          products: cached,
          hasMore: cached.length === this.batchSize,
          total: this.totalProducts || this.loadedProducts.length
        }
      }

      // Load from API
      const params = new URLSearchParams({
        limit: this.batchSize.toString(),
        offset: this.currentOffset.toString(),
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD', // Include region for proper pricing
        fields: '*variants.calculated_price' // Request price data
      })
      
      const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch more products: ${response.status}`)
      }

      const data = await response.json()
      const newProducts = data.products || []
      
      // Cache this batch
      if (newProducts.length > 0) {
        medusaProductCache.setByKey(cacheKey, newProducts)
      }
      
      this.loadedProducts = [...this.loadedProducts, ...newProducts]
      this.currentOffset += newProducts.length
      this.totalProducts = data.count || this.loadedProducts.length
      
      console.timeEnd(`[Progressive] Load batch at offset ${this.currentOffset - newProducts.length}`)
      console.log(`[Progressive] Loaded ${newProducts.length} more products (total: ${this.loadedProducts.length})`)
      
      this.isLoading = false
      
      return {
        products: newProducts,
        hasMore: newProducts.length === this.batchSize,
        total: this.totalProducts
      }
    } catch (error) {
      console.error('[Progressive] Failed to load more:', error)
      console.timeEnd(`[Progressive] Load batch at offset ${this.currentOffset}`)
      this.isLoading = false
      
      return { 
        products: [], 
        hasMore: false, 
        total: this.totalProducts || this.loadedProducts.length 
      }
    }
  }

  // Preload next batch in background
  async preloadNext(): Promise<void> {
    if (this.isLoading) return

    const nextOffset = this.currentOffset
    const cacheKey = `products_${this.batchSize}_${nextOffset}`
    
    // Only preload if not already cached
    if (medusaProductCache.getByKey(cacheKey)) {
      return
    }

    console.log(`[Progressive] Preloading batch at offset ${nextOffset}`)

    try {
      const params = new URLSearchParams({
        limit: this.batchSize.toString(),
        offset: nextOffset.toString(),
        region_id: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD', // Include region for proper pricing
        fields: '*variants.calculated_price' // Request price data
      })
      
      const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
        method: 'GET',
        headers: getHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        const products = data.products || []
        
        if (products.length > 0) {
          medusaProductCache.setByKey(cacheKey, products)
          console.log(`[Progressive] Preloaded ${products.length} products for offset ${nextOffset}`)
        }
      }
    } catch (error) {
      console.error('[Progressive] Preload failed:', error)
    }
  }
}

// Singleton instance for app-wide use
export const progressiveLoader = new MedusaProgressiveLoader(40)