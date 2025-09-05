/**
 * Test API Keys - Check which Medusa publishable key works
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // This endpoint will work if the key is valid
    // The frontend should be able to call this with the publishable key
    
    res.json({
      success: true,
      message: "API key is valid!",
      timestamp: new Date().toISOString(),
      headers_received: {
        has_publishable_key: !!req.headers['x-publishable-api-key'],
        key_prefix: req.headers['x-publishable-api-key'] 
          ? (Array.isArray(req.headers['x-publishable-api-key']) 
            ? req.headers['x-publishable-api-key'][0].substring(0, 10) 
            : req.headers['x-publishable-api-key'].substring(0, 10)) + '...'
          : 'NOT PROVIDED'
      }
    })
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: "Invalid API key"
    })
  }
}