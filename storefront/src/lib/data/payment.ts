import { sdk } from "@lib/config"
import { cache } from "react"

// Payment actions
export const listCartPaymentMethods = cache(async function (regionId: string) {
  try {
    // Add debug logging
    console.log("Fetching payment providers for region:", regionId)
    
    const response = await sdk.store.payment
      .listPaymentProviders(
        { region_id: regionId },
        { next: { tags: ["payment_providers"] } }
      )
    
    console.log("Payment providers response:", response)
    
    // Ensure we always return an array
    return response?.payment_providers || []
  } catch (error) {
    console.error("Error fetching payment providers:", error)
    return []
  }
})
