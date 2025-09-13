import { sdk } from "@lib/config"
import { cache } from "react"

// Payment actions
export const listCartPaymentMethods = cache(async function (regionId: string) {
  try {
    // Add debug logging
    console.log("Fetching payment providers for region:", regionId)
    
    // Don't make the request if regionId is empty or invalid
    if (!regionId || regionId.trim() === "") {
      console.warn("No region ID provided, skipping payment providers fetch")
      return []
    }
    
    const response = await sdk.store.payment
      .listPaymentProviders(
        { region_id: regionId }
        // Remove the tags parameter as it's not recognized by the backend
      )
    
    console.log("Payment providers response:", response)
    
    // Ensure we always return an array
    return response?.payment_providers || []
  } catch (error) {
    console.error("Error fetching payment providers:", error)
    return []
  }
})
