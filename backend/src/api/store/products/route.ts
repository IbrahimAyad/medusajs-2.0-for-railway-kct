/**
 * Store Products API - Fixed Version with Proper Pricing
 * Uses Medusa 2.0 Query API with calculated prices
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  Modules, 
  ContainerRegistrationKeys,
  remoteQueryObjectFromString
} from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
    const cacheService = req.scope.resolve(Modules.CACHE)
    
    // Parse query parameters
    const {
      limit = "20",
      offset = "0",
      category,
      search,
      min_price,
      max_price,
      sort = "created_at",
      region_id = "reg_01K3S6NDGAC1DSWH9MCZCWBWWD" // Default to US region
    } = req.query as Record<string, string>
    
    // Create cache key
    const cacheKey = `products:${limit}:${offset}:${category || ''}:${search || ''}:${min_price || ''}:${max_price || ''}:${sort}:${region_id}`
    
    // Try cache first
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      res.set('X-Cache', 'HIT')
      return res.json(cached)
    }
    
    // Build filters
    const filters: any = { status: "published" }
    if (category) {
      filters.categories = { handle: category }
    }
    if (search) {
      filters.$or = [
        { title: { $ilike: `%${search}%` } },
        { description: { $ilike: `%${search}%` } }
      ]
    }
    
    // Build query with calculated prices
    const queryObject = remoteQueryObjectFromString({
      entryPoint: "product",
      variables: {
        filters,
        order: { [sort]: "DESC" },
        take: parseInt(limit),
        skip: parseInt(offset)
      },
      fields: [
        "id",
        "title",
        "subtitle", 
        "description",
        "handle",
        "thumbnail",
        "status",
        "metadata",
        "images.*",
        "categories.*",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.barcode",
        "variants.manage_inventory",
        "variants.options.*",
        "variants.calculated_price.*"
      ]
    })
    
    // Add pricing context for region
    if (region_id) {
      (queryObject as any).variables = {
        ...(queryObject as any).variables,
        context: {
          "variants.calculated_price": {
            context: {
              region_id,
              currency_code: "usd"
            }
          }
        }
      }
    }
    
    // Execute query
    const { rows: products } = await remoteQuery(queryObject)
    
    // Get total count
    const countQuery = remoteQueryObjectFromString({
      entryPoint: "product",
      variables: { filters },
      fields: ["id"]
    })
    const { rows: allProducts } = await remoteQuery(countQuery)
    
    // Format products with proper pricing
    const formattedProducts = products.map((product: any) => {
      // Get the lowest variant price as the product price
      let productPrice = 0
      if (product.variants && product.variants.length > 0) {
        const prices = product.variants
          .map((v: any) => v.calculated_price?.calculated_amount)
          .filter((p: any) => p && p > 0)
        
        if (prices.length > 0) {
          productPrice = Math.min(...prices)
        }
      }
      
      return {
        id: product.id,
        title: product.title,
        subtitle: product.subtitle,
        description: product.description,
        handle: product.handle,
        thumbnail: product.thumbnail,
        images: product.images || [],
        categories: product.categories || [],
        price: productPrice, // Price in cents from calculated_price
        currency_code: "usd",
        variants: (product.variants || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          sku: v.sku,
          barcode: v.barcode,
          manage_inventory: v.manage_inventory || false,
          options: v.options || [],
          calculated_price: v.calculated_price, // Include full price object
          price: v.calculated_price?.calculated_amount || 0 // Convenience field
        }))
      }
    })
    
    // Apply price filters
    let filteredProducts = formattedProducts
    if (min_price) {
      const minCents = parseFloat(min_price) * 100
      filteredProducts = filteredProducts.filter(p => p.price >= minCents)
    }
    if (max_price) {
      const maxCents = parseFloat(max_price) * 100
      filteredProducts = filteredProducts.filter(p => p.price <= maxCents)
    }
    
    const response = {
      products: filteredProducts,
      count: filteredProducts.length,
      total: allProducts.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      region_id,
      currency_code: "usd"
    }
    
    // Cache for 60 seconds
    await cacheService.set(cacheKey, response, 60)
    
    // Set cache headers
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    res.set('X-Cache', 'MISS')
    
    res.json(response)
    
  } catch (error: any) {
    console.error("Products fetch error:", error)
    res.status(500).json({
      error: error.message,
      products: [],
      count: 0,
      total: 0
    })
  }
}

// Get single product by handle or ID
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { product_id, handle, region_id = "reg_01K3S6NDGAC1DSWH9MCZCWBWWD" } = req.body as any
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
    
    // Build filter
    const filters: any = {}
    if (product_id) {
      filters.id = product_id
    } else if (handle) {
      filters.handle = handle
    } else {
      return res.status(400).json({ error: "product_id or handle required" })
    }
    
    // Query with calculated prices
    const queryObject = remoteQueryObjectFromString({
      entryPoint: "product",
      variables: {
        filters,
        context: {
          "variants.calculated_price": {
            context: {
              region_id,
              currency_code: "usd"
            }
          }
        }
      },
      fields: [
        "id",
        "title",
        "subtitle",
        "description", 
        "handle",
        "thumbnail",
        "status",
        "metadata",
        "images.*",
        "categories.*",
        "tags.*",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.barcode",
        "variants.manage_inventory",
        "variants.options.*",
        "variants.calculated_price.*"
      ]
    })
    
    const { rows: products } = await remoteQuery(queryObject)
    
    if (!products || products.length === 0) {
      return res.status(404).json({ error: "Product not found" })
    }
    
    const product = products[0]
    
    // Get product price from variants
    let productPrice = 0
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants
        .map((v: any) => v.calculated_price?.calculated_amount)
        .filter((p: any) => p && p > 0)
      
      if (prices.length > 0) {
        productPrice = Math.min(...prices)
      }
    }
    
    const formattedProduct = {
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      handle: product.handle,
      thumbnail: product.thumbnail,
      images: product.images || [],
      categories: product.categories || [],
      tags: product.tags || [],
      price: productPrice,
      currency_code: "usd",
      variants: (product.variants || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        manage_inventory: v.manage_inventory || false,
        options: v.options || [],
        calculated_price: v.calculated_price,
        price: v.calculated_price?.calculated_amount || 0
      }))
    }
    
    res.json({
      product: formattedProduct,
      region_id,
      currency_code: "usd"
    })
    
  } catch (error: any) {
    console.error("Product fetch error:", error)
    res.status(500).json({
      error: error.message,
      product: null
    })
  }
}