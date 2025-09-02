/**
 * Execute product to tier mapping
 * This script runs inside the Railway backend container
 */

async function runTierMapping() {
  try {
    // First get preview
    console.log('Getting preview of tier mapping...');
    const previewRes = await fetch('http://localhost:9000/admin/map-products-to-tiers');
    const preview = await previewRes.json();
    
    console.log('\n=== PREVIEW ===');
    console.log('Total products to map:', preview.total_products);
    console.log('Products without prices:', preview.products_without_prices);
    console.log('\nSample mappings:');
    if (preview.sample_mappings) {
      preview.sample_mappings.slice(0, 5).forEach(m => {
        console.log(`  - ${m.title}: ${m.tier} ($${m.price}) - Stripe: ${m.stripe_id?.substring(0, 20)}...`);
      });
    }
    
    // Now execute the mapping
    console.log('\n=== EXECUTING TIER MAPPING ===');
    const execRes = await fetch('http://localhost:9000/admin/map-products-to-tiers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await execRes.json();
    
    if (result.success) {
      console.log('\n✅ MAPPING SUCCESSFUL!');
      console.log('Products mapped:', result.products_mapped);
      console.log('Prices updated:', result.prices_updated);
      console.log('Metadata updated:', result.metadata_updated);
      
      console.log('\n=== TIER DISTRIBUTION ===');
      if (result.tier_distribution) {
        Object.entries(result.tier_distribution).forEach(([tier, count]) => {
          console.log(`  ${tier}: ${count} products`);
        });
      }
      
      console.log('\n=== SAMPLE UPDATED PRODUCTS ===');
      if (result.sample_updated) {
        result.sample_updated.slice(0, 5).forEach(p => {
          console.log(`  - ${p.title}`);
          console.log(`    Tier: ${p.metadata?.tier}`);
          console.log(`    Price: $${p.metadata?.tier_price}`);
          console.log(`    Stripe ID: ${p.metadata?.stripe_price_id?.substring(0, 30)}...`);
        });
      }
    } else {
      console.error('\n❌ MAPPING FAILED:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('Error executing tier mapping:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Execute the function
runTierMapping().then(() => {
  console.log('\n=== TIER MAPPING COMPLETE ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});