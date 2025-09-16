import Medusa from "@medusajs/js-sdk"

// Medusa client configuration with proper auth setup
// IMPORTANT: Using the new KCT Menswear sales channel publishable key from environment
export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app",
  maxRetries: 3,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  auth: {
    type: "jwt" // Using JWT token authentication
  }
})

// Configuration constants - all values from environment variables
export const MEDUSA_CONFIG = {
  regionId: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD",
  regionIdEU: process.env.NEXT_PUBLIC_MEDUSA_REGION_ID_EU || "",
  salesChannelId: process.env.NEXT_PUBLIC_SALES_CHANNEL_ID || "",
  currency: "usd",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app",
}

// Helper to check connection
export async function checkMedusaConnection() {
  try {
    const regions = await medusa.store.region.list()
    return { connected: true, regions }
  } catch (error) {
    console.error("Medusa connection failed:", error)
    return { connected: false, error }
  }
}