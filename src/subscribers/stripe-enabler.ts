import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function stripeEnablerHandler({
  event,
  container,
}: SubscriberArgs<any>) {
  
  const regionService = container.resolve(Modules.REGION)
  const paymentService = container.resolve(Modules.PAYMENT)
  
  try {
    console.log("🔧 Checking Stripe payment provider configuration...")
    
    // Get the US region
    const regions = await regionService.listRegions({
      id: ["reg_01K3S6NDGAC1DSWH9MCZCWBWWD"]
    })
    
    if (!regions || regions.length === 0) {
      console.error("❌ Region reg_01K3S6NDGAC1DSWH9MCZCWBWWD not found")
      return
    }
    
    const region = regions[0]
    
    // The correct provider ID format
    const stripeProviderId = "pp_stripe_stripe"
    
    // Check if Stripe is already enabled
    if (region.payment_providers?.includes(stripeProviderId)) {
      console.log("✅ Stripe already enabled for region:", region.name)
      return
    }
    
    // Enable Stripe for the region
    console.log("🔄 Enabling Stripe payment provider for region:", region.name)
    
    await regionService.updateRegions(region.id, {
      payment_providers: [...(region.payment_providers || []), stripeProviderId]
    })
    
    console.log("✅ Stripe payment provider enabled successfully!")
    
    // List all available providers for debugging
    const providers = await paymentService.listPaymentProviders()
    console.log("📋 Available payment providers:", providers?.map(p => p.id) || [])
    
  } catch (error) {
    console.error("❌ Error enabling Stripe:", error)
  }
}

export const config: SubscriberConfig = {
  event: "system.ready", // Run when system is ready
}