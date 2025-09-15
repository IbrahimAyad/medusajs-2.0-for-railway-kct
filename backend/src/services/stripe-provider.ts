import Stripe from 'stripe'
import { AbstractPaymentProvider } from '@medusajs/framework/utils'
import { 
  Logger,
  PaymentSessionStatus,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  BigNumberInput
} from '@medusajs/framework/types'

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
      apiVersion: '2025-08-27.basil',
    })

    this.logger_.info('[StripeProvider] Custom Stripe provider initialized successfully')
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const paymentIntentId = input.data?.id as string

    if (!paymentIntentId?.startsWith('pi_')) {
      return { status: 'error' as PaymentSessionStatus }
    }

    try {
      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)
      
      let status: PaymentSessionStatus
      switch (paymentIntent.status) {
        case 'succeeded':
          status = 'authorized'
          break
        case 'requires_confirmation':
        case 'requires_action':
        case 'requires_payment_method':
          status = 'pending'
          break
        case 'processing':
          status = 'pending'
          break
        case 'canceled':
          status = 'canceled'
          break
        default:
          status = 'error'
      }
      
      return { status }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error getting payment status:', error)
      return { status: 'error' as PaymentSessionStatus }
    }
  }

  async initiatePayment(context: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    try {
      const { amount, currency_code } = context
      
      // Convert amount to cents (Stripe expects smallest currency unit)
      const amountInCents = this.convertAmountToStripeFormat(amount)
      
      if (amountInCents < 50) {
        throw new Error('Amount must be at least $0.50 USD')
      }

      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: currency_code || 'usd',
        metadata: {
          medusa_payment: 'true',
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

      this.logger_.info('[StripeProvider] Creating payment intent')

      const paymentIntent = await this.stripe_.paymentIntents.create(paymentIntentData)

      return {
        id: paymentIntent.id,
        data: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error creating payment intent:', error)
      
      throw new Error((error as Error).message || 'Failed to create payment intent')
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const paymentIntentId = input.data?.id as string
      
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required')
      }

      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status === 'succeeded') {
        return {
          status: 'authorized' as PaymentSessionStatus,
          data: {
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
          status: 'authorized' as PaymentSessionStatus,
          data: {
            id: confirmedPaymentIntent.id,
            amount: confirmedPaymentIntent.amount,
            currency: confirmedPaymentIntent.currency,
            status: confirmedPaymentIntent.status,
          },
        }
      }

      return {
        status: 'pending' as PaymentSessionStatus,
        data: input.data,
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error authorizing payment:', error)
      
      throw new Error((error as Error).message || 'Failed to authorize payment')
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    try {
      const paymentIntentId = input.data?.id as string
      
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required')
      }

      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)

      // If already captured/succeeded, return current state
      if (paymentIntent.status === 'succeeded') {
        return {
          data: {
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
          data: {
            id: capturedPaymentIntent.id,
            amount: capturedPaymentIntent.amount,
            currency: capturedPaymentIntent.currency,
            status: capturedPaymentIntent.status,
          },
        }
      }

      return {
        data: input.data,
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error capturing payment:', error)
      
      throw new Error((error as Error).message || 'Failed to capture payment')
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    try {
      const paymentIntentId = input.data?.id as string
      
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required')
      }

      const refundAmountInCents = this.convertAmountToStripeFormat(input.amount)

      const refund = await this.stripe_.refunds.create({
        payment_intent: paymentIntentId,
        amount: refundAmountInCents,
      })

      return {
        data: {
          id: refund.id,
          amount: refund.amount,
          currency: refund.currency,
          status: refund.status,
          payment_intent: paymentIntentId,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error refunding payment:', error)
      
      throw new Error((error as Error).message || 'Failed to refund payment')
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    try {
      const paymentIntentId = input.data?.id as string
      
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required')
      }

      const cancelledPaymentIntent = await this.stripe_.paymentIntents.cancel(paymentIntentId)

      return {
        data: {
          id: cancelledPaymentIntent.id,
          amount: cancelledPaymentIntent.amount,
          currency: cancelledPaymentIntent.currency,
          status: cancelledPaymentIntent.status,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error cancelling payment:', error)
      
      throw new Error((error as Error).message || 'Failed to cancel payment')
    }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // For Stripe, we'll cancel the payment intent instead of deleting
    return this.cancelPayment(input)
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    try {
      const paymentIntentId = input.data?.id as string
      
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required')
      }

      const paymentIntent = await this.stripe_.paymentIntents.retrieve(paymentIntentId)

      return {
        data: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error retrieving payment:', error)
      
      throw new Error((error as Error).message || 'Failed to retrieve payment')
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    try {
      const { amount, currency_code, data: paymentSessionData } = input
      const paymentIntentId = paymentSessionData?.id as string
      
      if (!paymentIntentId) {
        throw new Error('Payment intent ID is required')
      }

      const amountInCents = this.convertAmountToStripeFormat(amount)

      const paymentIntent = await this.stripe_.paymentIntents.update(paymentIntentId, {
        amount: amountInCents,
        currency: currency_code,
      })

      return {
        data: {
          id: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
        },
      }
    } catch (error) {
      this.logger_.error('[StripeProvider] Error updating payment:', error)
      
      throw new Error((error as Error).message || 'Failed to update payment')
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload['payload']
  ): Promise<WebhookActionResult> {
    try {
      const event = payload.data as unknown as Stripe.Event
      
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
  private convertAmountToStripeFormat(amount: BigNumberInput): number {
    // Handle different input types
    let numericAmount: number

    if (typeof amount === 'string') {
      numericAmount = parseFloat(amount)
    } else if (typeof amount === 'number') {
      numericAmount = amount
    } else if (amount && typeof amount === 'object') {
      // Handle BigNumber objects
      if ('toNumber' in amount && typeof (amount as any).toNumber === 'function') {
        numericAmount = (amount as any).toNumber()
      } else if ('toString' in amount) {
        numericAmount = parseFloat((amount as any).toString())
      } else {
        // Fallback for complex objects
        numericAmount = parseFloat(String(amount))
      }
    } else {
      numericAmount = 0
    }
    
    // Ensure it's a valid number
    if (isNaN(numericAmount) || numericAmount === null || numericAmount === undefined) {
      this.logger_.warn('[StripeProvider] Invalid amount received, using 0')
      return 0
    }

    // Medusa v2 ALREADY stores amounts in cents, so NO multiplication needed
    // Just ensure it's an integer
    const amountInCents = Math.round(numericAmount)
    
    this.logger_.info('[StripeProvider] Amount conversion completed')
    
    return amountInCents
  }
}

export default StripeProviderService