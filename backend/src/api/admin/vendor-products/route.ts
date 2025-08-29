import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET endpoint to fetch vendor products pending review
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get products from Shopify vendor that need review
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "description",
        "thumbnail",
        "status",
        "metadata",
        "variants.*",
        "images.*",
        "tags.*",
        "categories.*",
        "collection.*"
      ],
      filters: {
        metadata: {
          source: "shopify",
          curation_status: ["pending", null]
        }
      },
      pagination: {
        page: req.query.page || 1,
        pageSize: 20
      }
    })
    
    // Format for easy review
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      thumbnail: product.thumbnail,
      status: product.status,
      vendor_sku: product.metadata?.vendor_sku || "",
      vendor_price: product.metadata?.vendor_price || 0,
      our_price: product.variants?.[0]?.prices?.[0]?.amount || 0,
      inventory: product.variants?.[0]?.inventory_quantity || 0,
      curation_status: product.metadata?.curation_status || "pending",
      import_date: product.metadata?.import_date || new Date().toISOString()
    }))
    
    res.json({
      products: formattedProducts,
      count: products.length,
      status: "success"
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to fetch vendor products",
      message: error.message 
    })
  }
}

// POST endpoint to approve/reject products
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { productIds, action, collection, tags } = req.body
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    if (!productIds || !action) {
      return res.status(400).json({ 
        error: "Missing required fields: productIds and action" 
      })
    }
    
    // Update products based on action
    const updates = []
    
    for (const productId of productIds) {
      if (action === "approve") {
        // Approve product for store
        updates.push(
          query.graph({
            entity: "product",
            filters: { id: productId },
            data: {
              status: "published",
              metadata: {
                curation_status: "approved",
                approved_date: new Date().toISOString(),
                approved_by: req.user?.email || "admin"
              }
            }
          })
        )
        
        // Add to collection if specified
        if (collection) {
          updates.push(
            query.graph({
              entity: "product",
              filters: { id: productId },
              data: {
                collection_id: collection
              }
            })
          )
        }
        
        // Add tags if specified
        if (tags && tags.length > 0) {
          updates.push(
            query.graph({
              entity: "product",
              filters: { id: productId },
              data: {
                tags: tags
              }
            })
          )
        }
      } else if (action === "reject") {
        // Mark as rejected (won't show in store)
        updates.push(
          query.graph({
            entity: "product",
            filters: { id: productId },
            data: {
              status: "draft",
              metadata: {
                curation_status: "rejected",
                rejected_date: new Date().toISOString(),
                rejected_by: req.user?.email || "admin"
              }
            }
          })
        )
      } else if (action === "pending") {
        // Send back to review queue
        updates.push(
          query.graph({
            entity: "product",
            filters: { id: productId },
            data: {
              status: "draft",
              metadata: {
                curation_status: "pending"
              }
            }
          })
        )
      }
    }
    
    await Promise.all(updates)
    
    res.json({
      success: true,
      message: `${productIds.length} products ${action}ed`,
      productIds
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to update products",
      message: error.message 
    })
  }
}