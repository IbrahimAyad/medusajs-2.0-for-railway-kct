import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { 
  IRegionModuleService,
  IPaymentModuleService
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const regionService = req.scope.resolve<IRegionModuleService>(Modules.REGION)
  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)

  try {
    // Get the US region
    const regions = await regionService.listRegions({
      id: ["reg_01K3S6NDGAC1DSWH9MCZCWBWWD"]
    })
    
    if (!regions || regions.length === 0) {
      return res.status(404).json({ error: "Region not found" })
    }
    
    const region = regions[0]
    console.log("Found region:", region.name, region.id)
    
    // The correct provider ID format based on docs
    const stripeProviderId = "pp_stripe_stripe"
    
    // Check current payment providers
    console.log("Current payment providers:", region.payment_providers)
    
    // Check if Stripe is already enabled
    if (region.payment_providers?.includes(stripeProviderId)) {
      return res.json({
        message: "Stripe already enabled",
        region_id: region.id,
        payment_providers: region.payment_providers
      })
    }
    
    // Enable Stripe for the region
    const updatedRegion = await regionService.updateRegions(region.id, {
      payment_providers: [...(region.payment_providers || []), stripeProviderId]
    })
    
    console.log("✅ Stripe enabled for region:", updatedRegion)
    
    return res.json({
      success: true,
      message: "Stripe payment provider enabled",
      region_id: region.id,
      payment_providers: updatedRegion.payment_providers
    })
    
  } catch (error) {
    console.error("Error enabling Stripe:", error)
    return res.status(500).json({ 
      error: "Failed to enable Stripe",
      message: error.message,
      details: error
    })
  }
}

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const regionService = req.scope.resolve<IRegionModuleService>(Modules.REGION)
  const paymentService = req.scope.resolve<IPaymentModuleService>(Modules.PAYMENT)
  
  try {
    // List all payment providers
    const providers = await paymentService.listPaymentProviders()
    
    // Get region info
    const regions = await regionService.listRegions({
      id: ["reg_01K3S6NDGAC1DSWH9MCZCWBWWD"]
    })
    
    const region = regions[0]
    
    return res.json({
      available_providers: providers?.map(p => ({
        id: p.id,
        is_enabled: p.is_enabled
      })) || [],
      region_payment_providers: region?.payment_providers || [],
      region_name: region?.name,
      region_id: region?.id
    })
  } catch (error) {
    return res.status(500).json({ 
      error: "Failed to get provider info",
      message: error.message
    })
  }
}