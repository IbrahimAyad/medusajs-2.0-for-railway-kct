import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function enableStripeInRegion(container: MedusaContainer) {
  try {
    const regionService = container.resolve(Modules.REGION)
    const paymentService = container.resolve(Modules.PAYMENT)
    
    // Get the US region
    const regions = await regionService.listRegions({
      id: ["reg_01K3S6NDGAC1DSWH9MCZCWBWWD"]
    })
    
    if (regions.length === 0) {
      console.log("Region not found")
      return
    }
    
    const region = regions[0]
    console.log("Found region:", region.name)
    
    // List available payment providers
    const providers = await paymentService.listPaymentProviders()
    console.log("Available payment providers:", providers?.map(p => p.id))
    
    // Enable Stripe for the region if not already enabled
    const stripeProvider = providers?.find(p => 
      p.id === "stripe" || 
      p.id === "stripe_stripe" || 
      p.id === "pp_stripe" ||
      p.id === "pp_stripe_stripe"
    )
    
    if (stripeProvider) {
      console.log(`Stripe provider found with ID: ${stripeProvider.id}`)
      
      // Update region to include Stripe provider
      await regionService.updateRegions(region.id, {
        payment_providers: [...(region.payment_providers || []), stripeProvider.id]
      })
      
      console.log(`✅ Stripe provider ${stripeProvider.id} enabled for region ${region.name}`)
    } else {
      console.log("❌ No Stripe provider found in the system")
      
      // Try to register Stripe provider manually
      console.log("Attempting to register Stripe provider...")
      
      // This might not work but worth trying
      try {
        const newProvider = await paymentService.createPaymentProviders({
          id: "stripe",
          is_enabled: true
        })
        console.log("✅ Stripe provider registered:", newProvider)
      } catch (createError) {
        console.log("❌ Could not register provider:", createError.message)
      }
    }
    
  } catch (error) {
    console.error("Error enabling Stripe:", error)
  }
}

// Run on startup
enableStripeInRegion