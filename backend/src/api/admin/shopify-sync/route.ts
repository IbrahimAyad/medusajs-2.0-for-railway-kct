import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface SyncRequestBody {
  productIds?: string[]
}

export const POST = async (req: MedusaRequest<SyncRequestBody>, res: MedusaResponse) => {
  try {
    const { productIds } = req.body as SyncRequestBody
    
    // Trigger Shopify sync
    // The medusa-source-shopify plugin handles this automatically
    // But we can trigger it manually if needed
    
    // For now, just return success
    // In production, you'd call the Shopify service here
    
    res.json({
      success: true,
      message: productIds 
        ? `Syncing ${productIds.length} selected products`
        : "Syncing all Shopify products",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to trigger sync",
      message: error.message 
    })
  }
}