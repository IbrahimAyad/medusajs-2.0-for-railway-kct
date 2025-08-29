import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    // Check if Shopify environment variables are configured
    const shopifyConfig = {
      domain: process.env.SHOPIFY_DOMAIN,
      hasAccessToken: !!process.env.SHOPIFY_ACCESS_TOKEN,
      locationId: process.env.SHOPIFY_LOCATION_ID,
    }

    // Check if required variables are present
    const isConfigured = !!(
      shopifyConfig.domain &&
      shopifyConfig.hasAccessToken &&
      shopifyConfig.locationId
    )

    res.json({
      status: isConfigured ? "configured" : "not_configured",
      config: {
        domain: shopifyConfig.domain || "Not set",
        accessToken: shopifyConfig.hasAccessToken ? "Set (hidden)" : "Not set",
        locationId: shopifyConfig.locationId || "Not set",
      },
      message: isConfigured
        ? "Shopify integration is configured"
        : "Shopify integration is not fully configured. Please set all required environment variables in Railway.",
    })
  } catch (error) {
    console.error("Error checking Shopify status:", error)
    res.status(500).json({
      error: "Failed to check Shopify configuration status",
      message: error.message,
    })
  }
}