import { 
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse
} from "@medusajs/framework/workflows-sdk"

/**
 * Step to fetch pending vendor products
 */
const fetchPendingProductsStep = createStep(
  "fetch-pending-products",
  async ({ limit = 50 }, { container }) => {
    const query = container.resolve("query")
    
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "status", "metadata"],
      filters: {
        metadata: {
          source: "shopify",
          curation_status: "pending"
        },
        status: "draft"
      },
      pagination: {
        pageSize: limit
      }
    })
    
    return new StepResponse({ products })
  }
)

/**
 * Step to approve products
 */
const approveProductsStep = createStep(
  "approve-products",
  async ({ productIds, collection, tags }, { container }) => {
    const productService = container.resolve("product")
    
    const approved = []
    for (const productId of productIds) {
      await productService.update(productId, {
        status: "published",
        collection_id: collection,
        tags: tags,
        metadata: {
          curation_status: "approved",
          approved_date: new Date().toISOString()
        }
      })
      approved.push(productId)
    }
    
    return new StepResponse({ 
      approved,
      message: `Approved ${approved.length} products`
    })
  },
  async ({ approved }) => {
    // Compensation: revert to pending if workflow fails
    const productService = container.resolve("product")
    for (const productId of approved) {
      await productService.update(productId, {
        status: "draft",
        metadata: {
          curation_status: "pending"
        }
      })
    }
  }
)

/**
 * Workflow for vendor product curation
 */
export const vendorCurationWorkflow = createWorkflow(
  "vendor-curation",
  function (input: {
    action: "approve" | "reject" | "auto-approve"
    productIds?: string[]
    collection?: string
    tags?: string[]
    autoApproveRules?: {
      minPrice?: number
      maxPrice?: number
      categories?: string[]
      keywords?: string[]
    }
  }) {
    if (input.action === "auto-approve" && input.autoApproveRules) {
      // Auto-approve based on rules
      const pendingProducts = fetchPendingProductsStep({ limit: 100 })
      
      // Filter products based on rules
      const filteredIds = pendingProducts.products
        .filter(product => {
          const price = product.metadata?.vendor_price || 0
          const title = product.title?.toLowerCase() || ""
          
          // Apply price rules
          if (input.autoApproveRules.minPrice && price < input.autoApproveRules.minPrice) {
            return false
          }
          if (input.autoApproveRules.maxPrice && price > input.autoApproveRules.maxPrice) {
            return false
          }
          
          // Apply keyword rules
          if (input.autoApproveRules.keywords?.length > 0) {
            const hasKeyword = input.autoApproveRules.keywords.some(
              keyword => title.includes(keyword.toLowerCase())
            )
            if (!hasKeyword) return false
          }
          
          return true
        })
        .map(p => p.id)
      
      const result = approveProductsStep({
        productIds: filteredIds,
        collection: input.collection,
        tags: input.tags
      })
      
      return new WorkflowResponse(result)
    } else if (input.action === "approve" && input.productIds) {
      // Manual approval
      const result = approveProductsStep({
        productIds: input.productIds,
        collection: input.collection,
        tags: input.tags
      })
      
      return new WorkflowResponse(result)
    }
    
    return new WorkflowResponse({ 
      message: "No action taken",
      productIds: [] 
    })
  }
)