/**
 * List API keys
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const apiKeyModuleService = req.scope.resolve(Modules.API_KEY)
    
    // List all API keys
    const apiKeys = await apiKeyModuleService.listApiKeys({})
    
    res.json({
      api_keys: apiKeys.map(key => ({
        id: key.id,
        title: key.title,
        type: key.type,
        token: key.token,
        created_at: key.created_at
      })),
      publishable_keys: apiKeys.filter(k => k.type === 'publishable').map(k => k.token)
    })
    
  } catch (error: any) {
    console.error("[List API Keys] Error:", error)
    res.status(500).json({
      error: "Failed to list API keys",
      message: error.message
    })
  }
}