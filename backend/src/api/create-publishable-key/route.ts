/**
 * Create Medusa Publishable API Key
 * This is NOT a Stripe key - it's for API authentication
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const apiKeyModuleService = req.scope.resolve(Modules.API_KEY)
    
    // List existing publishable keys
    const existingKeys = await apiKeyModuleService.listApiKeys({})
    
    const publishableKeys = existingKeys.filter((k: any) => 
      k.type === 'publishable' || k.token?.startsWith('pk_')
    )
    
    if (publishableKeys.length > 0) {
      return res.json({
        success: true,
        message: "Found existing publishable key",
        key: publishableKeys[0].token,
        title: publishableKeys[0].title,
        created_at: publishableKeys[0].created_at,
        instructions: "Add this to frontend as x-publishable-api-key header"
      })
    }
    
    // Create new publishable key if none exists
    const newKey = await apiKeyModuleService.createApiKeys({
      title: "Frontend Store Access",
      type: "publishable",
      created_by: "system"
    })
    
    res.json({
      success: true,
      message: "Created new publishable API key",
      key: newKey.token,
      instructions: "Add this to frontend as x-publishable-api-key header"
    })
    
  } catch (error: any) {
    res.status(500).json({
      error: error.message,
      note: "This creates a MEDUSA API key, not a Stripe key"
    })
  }
}