import Medusa from "@medusajs/medusa-js"

// Create Medusa client with proper configuration
const medusaClient = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app",
  maxRetries: 3,
  publishableApiKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81",
})

export default medusaClient

// Export the region ID for consistency
export const MEDUSA_REGION_ID = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || process.env.NEXT_PUBLIC_REGION_ID || "reg_01K3S6NDGAC1DSWH9MCZCWBWWD"