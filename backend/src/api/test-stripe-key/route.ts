import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const key = process.env.STRIPE_API_KEY || '';
  
  // Test different ways the key might be parsed
  const tests = {
    full_key: key,
    length: key.length,
    first_10_chars: key.substring(0, 10),
    last_10_chars: key.substring(key.length - 10),
    split_by_underscore: key.split('_'),
    includes_test: key.includes('test'),
    includes_live: key.includes('live'),
    starts_with_sk: key.startsWith('sk'),
    // Check if there's any weird encoding
    char_codes_first_10: key.substring(0, 10).split('').map(c => c.charCodeAt(0)),
    // Try to replicate what Stripe SDK might be doing
    key_parts: key.match(/^(sk)_(live|test)_(.+)$/),
  };
  
  return res.json({
    key_diagnostic: tests,
    env_var_exists: !!process.env.STRIPE_API_KEY,
  });
}