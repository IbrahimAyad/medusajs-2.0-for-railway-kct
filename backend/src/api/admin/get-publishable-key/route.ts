/**
 * Get or Create Publishable API Key
 * Returns the publishable key for frontend use
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const apiKeyModuleService = req.scope.resolve(Modules.API_KEY)
    
    // List existing API keys
    const existingKeys = await apiKeyModuleService.listApiKeys({
      type: 'publishable'
    })
    
    if (existingKeys.length > 0) {
      // Return existing publishable key
      const key = existingKeys[0]
      return res.json({
        success: true,
        publishable_key: key.token,
        key_id: key.id,
        title: key.title,
        created_at: key.created_at,
        message: "Existing publishable key found"
      })
    }
    
    // Create new publishable key if none exists
    const newKey = await apiKeyModuleService.createApiKeys({
      title: "Store Frontend Key",
      type: "publishable",
      created_by: req.auth?.actor_id || "system"
    })
    
    res.json({
      success: true,
      publishable_key: newKey.token,
      key_id: newKey.id,
      title: newKey.title,
      created_at: newKey.created_at,
      message: "New publishable key created"
    })
    
  } catch (error: any) {
    console.error("[Get Publishable Key] Error:", error)
    res.status(500).json({
      error: "Failed to get publishable key",
      message: error.message
    })
  }
}