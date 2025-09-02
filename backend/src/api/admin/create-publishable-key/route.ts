/**
 * Create a publishable API key
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const apiKeyModuleService = req.scope.resolve(Modules.API_KEY)
    
    // Create a publishable API key
    const apiKey = await apiKeyModuleService.createApiKeys({
      title: "Store Frontend Key",
      type: "publishable",
      created_by: "system"
    })
    
    res.json({
      success: true,
      api_key: apiKey
    })
    
  } catch (error: any) {
    console.error("[Create Publishable Key] Error:", error)
    res.status(500).json({
      error: "Failed to create publishable key",
      message: error.message
    })
  }
}