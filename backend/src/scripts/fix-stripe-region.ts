import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function fixStripeRegion({ container }: ExecArgs) {
  const regionModule = container.resolve(Modules.REGION)
  const paymentModule = container.resolve(Modules.PAYMENT)
  
  try {
    console.log("🔧 Fixing Stripe payment provider for US region...")
    
    // Check if US region exists
    const regions = await regionModule.listRegions({
      id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
    })
    
    if (!regions || regions.length === 0) {
      console.log("❌ US region not found. Creating it...")
      
      // Create US region
      await regionModule.createRegions({
        id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',
        name: 'United States',
        currency_code: 'usd',
        countries: ['us'],
        payment_providers: ['pp_stripe_stripe'],
      })
      
      console.log("✅ US region created with Stripe enabled")
    } else {
      console.log("✅ US region exists")
      
      // Update region to include Stripe
      const region = regions[0]
      console.log("Current payment providers:", region.payment_providers)
      
      // Check if Stripe is already enabled
      const hasStripe = region.payment_providers?.some((p: any) => 
        p.id === 'pp_stripe_stripe' || p === 'pp_stripe_stripe'
      )
      
      if (!hasStripe) {
        console.log("Adding Stripe to region...")
        
        // Update region with Stripe
        await regionModule.updateRegions({
          id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD',
          payment_providers: ['pp_stripe_stripe']
        })
        
        console.log("✅ Stripe added to US region")
      } else {
        console.log("✅ Stripe is already enabled for this region")
      }
    }
    
    // List all payment providers to confirm
    const paymentProviders = await paymentModule.listPaymentProviders()
    console.log("\n📋 Available payment providers:")
    paymentProviders.forEach((provider: any) => {
      console.log(`  - ${provider.id} (enabled: ${provider.is_enabled})`)
    })
    
    // Verify the fix
    const updatedRegions = await regionModule.listRegions({
      id: 'reg_01K3S6NDGAC1DSWH9MCZCWBWWD'
    })
    
    if (updatedRegions && updatedRegions[0]) {
      console.log("\n✅ Final region configuration:")
      console.log("  ID:", updatedRegions[0].id)
      console.log("  Name:", updatedRegions[0].name)
      console.log("  Currency:", updatedRegions[0].currency_code)
      console.log("  Payment Providers:", updatedRegions[0].payment_providers)
    }
    
    console.log("\n🎉 Script completed successfully!")
    console.log("Stripe should now be available for the US region.")
    
  } catch (error) {
    console.error("❌ Error fixing Stripe region:", error)
    throw error
  }
}