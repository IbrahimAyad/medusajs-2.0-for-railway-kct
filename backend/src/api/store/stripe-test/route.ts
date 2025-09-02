/**
 * Stripe Configuration Test
 * Tests if Stripe is properly configured
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from 'stripe'

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const stripeKey = process.env.STRIPE_API_KEY
    
    if (!stripeKey) {
      return res.json({
        status: 'error',
        message: 'STRIPE_API_KEY not configured',
        configured: false
      })
    }
    
    // Test Stripe connection
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia'
    })
    
    // Try to create a test PaymentIntent
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000, // $50.00
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          test: 'true',
          source: 'medusa-diagnostic'
        }
      })
      
      // Cancel it immediately since this is just a test
      await stripe.paymentIntents.cancel(paymentIntent.id)
      
      return res.json({
        status: 'success',
        message: 'Stripe is properly configured',
        configured: true,
        stripe_account: {
          key_type: stripeKey.startsWith('sk_live') ? 'live' : 'test',
          key_prefix: stripeKey.substring(0, 12) + '...',
          webhook_configured: !!process.env.STRIPE_WEBHOOK_SECRET
        },
        test_result: {
          payment_intent_created: true,
          payment_intent_id: paymentIntent.id,
          client_secret_format: 'pi_xxx_secret_xxx'
        }
      })
      
    } catch (stripeError: any) {
      return res.json({
        status: 'error',
        message: 'Stripe API key is invalid or has insufficient permissions',
        configured: false,
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code
      })
    }
    
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to test Stripe configuration',
      error: error.message
    })
  }
}