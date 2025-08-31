import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  // Only allow in development or with special header
  const debugKey = req.headers['x-debug-key'];
  if (process.env.NODE_ENV === 'production' && debugKey !== 'debug-stripe-2025') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const stripeKey = process.env.STRIPE_API_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  return res.json({
    stripe_configured: !!(stripeKey && webhookSecret),
    stripe_key_exists: !!stripeKey,
    stripe_key_length: stripeKey ? stripeKey.length : 0,
    stripe_key_prefix: stripeKey ? stripeKey.substring(0, 12) + '...' : 'NOT SET',
    stripe_key_starts_with: stripeKey ? stripeKey.substring(0, 7) : 'NOT SET',
    webhook_secret_exists: !!webhookSecret,
    webhook_secret_length: webhookSecret ? webhookSecret.length : 0,
    node_env: process.env.NODE_ENV,
    railway_env: process.env.RAILWAY_ENVIRONMENT,
    // Check if the key is being read correctly
    raw_env_check: {
      has_stripe_key: 'STRIPE_API_KEY' in process.env,
      key_type: typeof process.env.STRIPE_API_KEY,
    }
  });
}