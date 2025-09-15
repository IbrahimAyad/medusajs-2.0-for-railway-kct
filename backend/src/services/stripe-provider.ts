import Stripe from 'stripe'
import { 
  AbstractPaymentProvider,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  PaymentSessionStatus,
  CreatePaymentProviderSession,
  UpdatePaymentProviderSession,
  ProviderWebhookPayload,
  WebhookActionResult,
} from '@medusajs/framework/utils'
import { Logger } from '@medusajs/framework/types'

interface StripeProviderOptions {
  apiKey: string
  webhookSecret?: string
  capture?: boolean
  automatic_payment_methods?: boolean
  payment_description?: string
}

export class StripeProviderService extends AbstractPaymentProvider<StripeProviderOptions> {
  static identifier = 'stripe'
  
  protected readonly options_: StripeProviderOptions
  protected stripe_: Stripe
  protected logger_: Logger

  constructor(
    container: any,
    options: StripeProviderOptions
  ) {
    super(container, options)
    
    this.options_ = options
    this.logger_ = container.logger || console

    if (!this.options_.apiKey) {
      throw new Error('Stripe API key is required')
    }

    this.stripe_ = new Stripe(this.options_.apiKey, {
      apiVersion: '2024-12-18.acacia',
    })

    this.logger_.info('[StripeProvider] Custom Stripe provider initialized successfully')
  }

  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    const paymentIntentId = paymentSessionData.id as string

    if (!paymentIntentId?.startsWith('pi_')) {
      return PaymentSessionStatus.ERROR
    }

    try {
      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)
      
      switch (paymentIntent.status) {
        case 'succeeded':
          return PaymentSessionStatus.AUTHORIZED
        case 'requires_confirmation':
        case 'requires_action':
        case 'requires_payment_method':
          return PaymentSessionStatus.PENDING
        case 'processing':
          return PaymentSessionStatus.PENDING
        case 'canceled':
          return PaymentSessionStatus.CANCELED
        default:
          return PaymentSessionStatus.ERROR
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error getting payment status:', error)
      return PaymentSessionStatus.ERROR
    }
  }

  async initiatePayment(context: CreatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const { amount, currency_code, resource_id, customer, context: paymentContext } = context
      
      // Convert amount to cents (Stripe expects smallest currency unit)
      const amountInCents = this.convertAmountToStripeFormat(amount)
      
      if (amountInCents < 50) {
        return {
          error: 'Amount must be at least $0.50 USD',
          code: 'invalid_amount',
          detail: { amount: amountInCents }
        }
      }

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: currency_code || 'usd',
        metadata: {
          resource_id: resource_id || '',
          medusa_cart_id: paymentContext?.cart_id || resource_id || '',
          customer_id: customer?.id || '',
        },
        description: this.options_.payment_description || 'Payment',
      }

      // Use either automatic_payment_methods OR payment_method_types, not both
      if (this.options_.automatic_payment_methods) {
        paymentIntentData.automatic_payment_methods = {
          enabled: true,
        }
      } else {
        paymentIntentData.payment_method_types = ['card']
      }

      // Add customer to Stripe if provided
      if (customer?.email) {
        paymentIntentData.receipt_email = customer.email
      }

      this.logger_.info('[StripeProvider] Creating payment intent:', {
        amount: amountInCents,
        currency: currency_code,
        resource_id
      })

      const paymentIntent = await this.stripe_.paymentIntents.create(paymentIntentData)

      return {
        session_data: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error creating payment intent:', error)
      
      return {
        error: (error as Error).message || 'Failed to create payment intent',
        code: 'payment_intent_creation_failed',
        detail: error
      }
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const paymentIntentId = paymentSessionData.id as string
      
      if (!paymentIntentId) {
        return {
          error: 'Payment intent ID is required',
          code: 'missing_payment_intent_id',
          detail: paymentSessionData
        }
      }

      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status === 'succeeded') {
        return {
          session_data: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
          },
        }
      }

      // If payment requires confirmation, confirm it
      if (paymentIntent.status === 'requires_confirmation') {
        const confirmedPaymentIntent = await this.stripe_.paymentIntents.confirm(paymentIntentId)
        
        return {
          session_data: {
            id: confirmedPaymentIntent.id,
            amount: confirmedPaymentIntent.amount,
            currency: confirmedPaymentIntent.currency,
            status: confirmedPaymentIntent.status,
          },
        }
      }

      return {
        session_data: paymentSessionData,
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error authorizing payment:', error)
      
      return {
        error: (error as Error).message || 'Failed to authorize payment',
        code: 'payment_authorization_failed',
        detail: error
      }
    }
  }

  async capturePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const paymentIntentId = paymentSessionData.id as string
      
      if (!paymentIntentId) {
        return {
          error: 'Payment intent ID is required',
          code: 'missing_payment_intent_id',
          detail: paymentSessionData
        }
      }

      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)

      // If already captured/succeeded, return current state
      if (paymentIntent.status === 'succeeded') {
        return {
          session_data: {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
          },
        }
      }

      // If payment intent requires capture, capture it
      if (paymentIntent.status === 'requires_capture') {
        const capturedPaymentIntent = await this.stripe_.paymentIntents.capture(paymentIntentId)
        
        return {
          session_data: {
            id: capturedPaymentIntent.id,
            amount: capturedPaymentIntent.amount,
            currency: capturedPaymentIntent.currency,
            status: capturedPaymentIntent.status,
          },
        }
      }

      return {
        session_data: paymentSessionData,
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error capturing payment:', error)
      
      return {
        error: (error as Error).message || 'Failed to capture payment',
        code: 'payment_capture_failed',
        detail: error
      }
    }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const paymentIntentId = paymentSessionData.id as string
      
      if (!paymentIntentId) {
        return {
          error: 'Payment intent ID is required',
          code: 'missing_payment_intent_id',
          detail: paymentSessionData
        }
      }

      const refundAmountInCents = this.convertAmountToStripeFormat(refundAmount)

      const refund = await this.stripe_.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmountInCents,
      })

      return {
        session_data: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          payment_intent: paymentIntentId,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error refunding payment:', error)
      
      return {
        error: (error as Error).message || 'Failed to refund payment',
        code: 'payment_refund_failed',
        detail: error
      }
    }
  }

  async cancelPayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const paymentIntentId = paymentSessionData.id as string
      
      if (!paymentIntentId) {
        return {
          error: 'Payment intent ID is required',
          code: 'missing_payment_intent_id',
          detail: paymentSessionData
        }
      }

      const cancelledPaymentIntent = await this.stripe_.paymentIntents.cancel(paymentIntentId)

      return {
        session_data: {
          id: cancelledPaymentIntent.id,
          amount: cancelledPaymentIntent.amount,
          currency: cancelledPaymentIntent.currency,
          status: cancelledPaymentIntent.status,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error cancelling payment:', error)
      
      return {
        error: (error as Error).message || 'Failed to cancel payment',
        code: 'payment_cancellation_failed',
        detail: error
      }
    }
  }

  async deletePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    // For Stripe, we'll cancel the payment intent instead of deleting
    return this.cancelPayment(paymentSessionData)
  }

  async retrievePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const paymentIntentId = paymentSessionData.id as string
      
      if (!paymentIntentId) {
        return {
          error: 'Payment intent ID is required',
          code: 'missing_payment_intent_id',
          detail: paymentSessionData
        }
      }

      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)

      return {
        session_data: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error retrieving payment:', error)
      
      return {
        error: (error as Error).message || 'Failed to retrieve payment',
        code: 'payment_retrieval_failed',
        detail: error
      }
    }
  }

  async updatePayment(
    context: UpdatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      const { amount, currency_code, data: paymentSessionData } = context
      const paymentIntentId = paymentSessionData.id as string
      
      if (!paymentIntentId) {
        return {
          error: 'Payment intent ID is required',
          code: 'missing_payment_intent_id',
          detail: paymentSessionData
        }
      }

      const amountInCents = this.convertAmountToStripeFormat(amount)

      const paymentIntent = await this.stripe_.paymentIntents.update(paymentIntentId, {
        amount: amountInCents,
        currency: currency_code,
      })

      return {
        session_data: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error updating payment:', error)
      
      return {
        error: (error as Error).message || 'Failed to update payment',
        code: 'payment_update_failed',
        detail: error
      }
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    try {
      const event = payload.data as Stripe.Event
      
      switch (event.type) {
        case 'payment_intent.succeeded':
          return {
            action: 'authorized',
            data: {
              session_id: event.data.object.id,
              amount: event.data.object.amount,
            },
          }
        case 'payment_intent.payment_failed':
          return {
            action: 'failed',
            data: {
              session_id: event.data.object.id,
              amount: event.data.object.amount,
            },
          }
        case 'payment_intent.canceled':
          return {
            action: 'canceled',
            data: {
              session_id: event.data.object.id,
              amount: event.data.object.amount,
            },
          }
        default:
          return {
            action: 'not_supported',
          }
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error processing webhook:', error)
      return {
        action: 'failed',
      }
    }
  }

  // Helper method to convert amount to Stripe format (cents)
  private convertAmountToStripeFormat(amount: number): number {
    // Handle BigNumber objects that Medusa sometimes passes
    if (typeof amount === 'object' && amount !== null) {
      // Convert BigNumber to number
      if ('toNumber' in amount && typeof (amount as any).toNumber === 'function') {
        amount = (amount as any).toNumber()
      } else if ('toString' in amount) {
        amount = parseFloat((amount as any).toString())
      } else {
        // Fallback for complex objects
        amount = parseFloat(String(amount))
      }
    }
    
    // Ensure it's a valid number
    if (isNaN(amount) || amount === null || amount === undefined) {
      this.logger_.warn('[StripeProvider] Invalid amount received, using 0:', { originalAmount: amount })
      return 0
    }

    // Medusa v2 ALREADY stores amounts in cents, so NO multiplication needed
    // Just ensure it's an integer
    const amountInCents = Math.round(amount)
    
    this.logger_.info('[StripeProvider] Amount conversion:', {
      original: amount,
      converted: amountInCents,
      note: 'Medusa v2 amounts are already in cents'
    })
    
    return amountInCents
  }
}

export default StripeProviderService