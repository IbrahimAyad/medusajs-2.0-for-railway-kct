import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Simplified Vendor Product Curation System
 * Uses product metadata to track vendor products without custom tables
 */

// GET /admin/vendor-curation - List products with vendor metadata
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productService: any = req.scope.resolve("productModuleService")
    const { status = "all", search = "" } = req.query
    
    // Get all products
    const products = await productService.list({}, { 
      take: 1000,
      relations: ["variants", "images"]
    })
    
    // Filter for vendor products (those with shopify metadata)
    let vendorProducts = products.filter(p => 
      p.metadata?.shopify_id || 
      p.metadata?.source === "shopify" ||
      p.metadata?.vendor_source
    )
    
    // Apply status filter
    if (status !== "all") {
      vendorProducts = vendorProducts.filter(p => {
        const productStatus = p.metadata?.curation_status || "pending"
        return productStatus === status
      })
    }
    
    // Apply search filter
    if (search) {
      const searchLower = String(search).toLowerCase()
      vendorProducts = vendorProducts.filter(p =>
        p.title?.toLowerCase().includes(searchLower) ||
        p.metadata?.vendor?.toLowerCase().includes(searchLower) ||
        p.metadata?.shopify_handle?.toLowerCase().includes(searchLower)
      )
    }
    
    // Format response with curation metadata
    const formattedProducts = vendorProducts.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      shopify_id: p.metadata?.shopify_id,
      vendor: p.metadata?.vendor || "Unknown",
      vendor_price: p.metadata?.vendor_price,
      our_price: p.variants?.[0]?.prices?.[0]?.amount,
      status: p.metadata?.curation_status || "pending",
      variants_count: p.variants?.length || 0,
      images: p.images?.map(i => i.url),
      last_synced: p.metadata?.last_synced_at,
      created_at: p.created_at
    }))
    
    // Get stats
    const stats = {
      total: formattedProducts.length,
      pending: formattedProducts.filter(p => p.status === "pending").length,
      approved: formattedProducts.filter(p => p.status === "approved").length,
      rejected: formattedProducts.filter(p => p.status === "rejected").length,
      published: formattedProducts.filter(p => p.status === "published").length
    }
    
    res.json({
      products: formattedProducts,
      stats,
      count: formattedProducts.length
    })
  } catch (error) {
    console.error("Error in vendor curation GET:", error)
    res.status(500).json({
      error: "Failed to fetch vendor products",
      message: error.message
    })
  }
}

// POST /admin/vendor-curation/approve - Approve products for store
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productService: any = req.scope.resolve("productModuleService")
    const { productIds, action, metadata = {} } = req.body as any
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        error: "productIds array is required"
      })
    }
    
    const results = []
    
    for (const productId of productIds) {
      try {
        const product = await productService.retrieve(productId)
        
        if (!product) {
          results.push({ id: productId, success: false, error: "Product not found" })
          continue
        }
        
        // Update product metadata based on action
        const updatedMetadata = {
          ...product.metadata,
          ...metadata,
          curation_status: action || "approved",
          curated_at: new Date().toISOString(),
          curated_by: "admin"
        }
        
        // If publishing, also set product status
        if (action === "publish") {
          updatedMetadata.curation_status = "published"
          await productService.update(productId, {
            status: "published",
            metadata: updatedMetadata
          })
        } else if (action === "reject") {
          updatedMetadata.curation_status = "rejected"
          await productService.update(productId, {
            status: "draft",
            metadata: updatedMetadata
          })
        } else {
          await productService.update(productId, {
            metadata: updatedMetadata
          })
        }
        
        results.push({ id: productId, success: true, status: updatedMetadata.curation_status })
      } catch (err) {
        results.push({ id: productId, success: false, error: err.message })
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${productIds.length} products`,
      results
    })
  } catch (error) {
    console.error("Error in vendor curation POST:", error)
    res.status(500).json({
      error: "Failed to update products",
      message: error.message
    })
  }
}

// DELETE /admin/vendor-curation/:id - Remove vendor product
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productService: any = req.scope.resolve("productModuleService")
    const productId = req.params.id
    
    if (!productId) {
      return res.status(400).json({
        error: "Product ID is required"
      })
    }
    
    // Instead of deleting, mark as rejected
    const product = await productService.retrieve(productId)
    
    if (!product) {
      return res.status(404).json({
        error: "Product not found"
      })
    }
    
    await productService.update(productId, {
      status: "draft",
      metadata: {
        ...product.metadata,
        curation_status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: "admin"
      }
    })
    
    res.json({
      success: true,
      message: "Product rejected and moved to draft status"
    })
  } catch (error) {
    console.error("Error in vendor curation DELETE:", error)
    res.status(500).json({
      error: "Failed to remove product",
      message: error.message
    })
  }
}