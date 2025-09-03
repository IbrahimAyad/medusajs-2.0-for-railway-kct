/**
 * Store Products API
 * Public endpoint for fetching products with pricing
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Parse query parameters
    const {
      limit = "20",
      offset = "0",
      category,
      search,
      min_price,
      max_price,
      sort = "created_at"
    } = req.query as Record<string, string>
    
    // Build filters
    const filters: any = {}
    if (category) {
      filters.categories = { handle: category }
    }
    if (search) {
      filters.$or = [
        { title: { $ilike: `%${search}%` } },
        { description: { $ilike: `%${search}%` } }
      ]
    }
    
    // Get products
    const products = await productModuleService.listProducts(
      filters,
      {
        take: parseInt(limit),
        skip: parseInt(offset),
        order: { [sort]: "DESC" },
        relations: ["variants", "images", "categories"]
      }
    )
    
    // Get total count for pagination
    const count = await productModuleService.listProducts(
      filters,
      { take: null }
    )
    
    // Format products with pricing from metadata
    const formattedProducts = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      handle: product.handle,
      thumbnail: product.thumbnail,
      images: product.images,
      categories: product.categories,
      pricing_tier: product.metadata?.pricing_tier,
      price: product.metadata?.tier_price || 0,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        inventory_quantity: v.inventory_quantity || 0,
        options: v.options
      }))
    }))
    
    // Apply price filters if provided
    let filteredProducts = formattedProducts
    if (min_price) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(min_price))
    }
    if (max_price) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(max_price))
    }
    
    res.json({
      products: filteredProducts,
      count: filteredProducts.length,
      total: count.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    })
    
  } catch (error: any) {
    console.error("Products fetch error:", error)
    res.status(500).json({
      error: error.message,
      products: [],
      count: 0
    })
  }
}

// Get single product by ID
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { product_id } = req.body
    const productModuleService = req.scope.resolve(Modules.PRODUCT)
    
    const product = await productModuleService.retrieveProduct(product_id, {
      relations: ["variants", "images", "categories"]
    })
    
    const formattedProduct = {
      id: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      handle: product.handle,
      thumbnail: product.thumbnail,
      images: product.images,
      categories: product.categories,
      pricing_tier: product.metadata?.pricing_tier,
      price: product.metadata?.tier_price || 0,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        inventory_quantity: v.inventory_quantity || 0,
        options: v.options,
        price: product.metadata?.tier_price || 0
      }))
    }
    
    res.json({
      product: formattedProduct
    })
    
  } catch (error: any) {
    console.error("Product fetch error:", error)
    res.status(500).json({
      error: error.message,
      product: null
    })
  }
}