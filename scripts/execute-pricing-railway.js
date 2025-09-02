/**
 * Execute Pricing Setup on Railway
 * This script runs inside the Railway container to set up product pricing
 */

async function setupPricing() {
  console.log("=================================");
  console.log("Product Pricing Setup - Railway");
  console.log("=================================\n");
  
  try {
    // Make the request to the local endpoint
    const response = await fetch('http://localhost:9000/admin/setup-product-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log("✅ Pricing setup completed successfully!\n");
      console.log("Results:");
      console.log(`- Total Products: ${result.results?.total_products || 0}`);
      console.log(`- Products Updated: ${result.results?.products_updated || 0}`);
      console.log(`- Variants Priced: ${result.results?.variants_priced || 0}`);
      console.log(`- Errors: ${result.results?.errors?.length || 0}`);
      
      if (result.results?.sample_updates?.length > 0) {
        console.log("\nSample Updates:");
        result.results.sample_updates.forEach(update => {
          console.log(`  - ${update.product} (${update.variant}): ${update.tier} = $${update.price}`);
        });
      }
      
      if (result.results?.errors?.length > 0) {
        console.log("\n⚠️ Errors encountered:");
        result.results.errors.slice(0, 5).forEach(err => {
          console.log(`  - ${err.product}: ${err.error}`);
        });
      }
    } else {
      console.log("❌ Pricing setup failed:");
      console.log(result);
    }
  } catch (error) {
    console.error("Error executing pricing setup:", error);
  }
  
  console.log("\n=================================");
  console.log("Setup Complete");
  console.log("=================================");
}

// Run the setup
setupPricing();