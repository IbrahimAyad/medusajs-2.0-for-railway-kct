/**
 * Create Publishable API Key
 * This creates a publishable API key for the storefront
 * This endpoint bypasses auth requirements for initial setup
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const apiKeyModuleService = req.scope.resolve(Modules.API_KEY)
    
    // Check if we already have a publishable key
    const existingKeys = await apiKeyModuleService.listApiKeys({
      type: "publishable"
    })
    
    if (existingKeys.length > 0) {
      return res.json({
        success: true,
        api_key: existingKeys[0].token,
        message: "Using existing publishable API key"
      })
    }
    
    // Create new publishable API key
    const apiKey = await apiKeyModuleService.createApiKeys({
      title: "Storefront Publishable Key",
      type: "publishable",
      created_by: "system"
    })
    
    res.json({
      success: true,
      api_key: apiKey.token,
      message: "Created new publishable API key"
    })
    
  } catch (error: any) {
    console.error("Error creating API key:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}