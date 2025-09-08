import { PaymentProviderService } from "@medusajs/framework/utils"
import Stripe from "stripe"

class StripeProviderService extends PaymentProviderService {
  static identifier = "stripe"
  protected stripe_: Stripe
  
  constructor(container, options) {
    super(container, options)
    
    // Initialize Stripe with the API key
    this.stripe_ = new Stripe(options.apiKey || process.env.STRIPE_API_KEY, {
      apiVersion: '2024-12-18.acacia'
    })
    
    console.log("✅ Stripe Provider Service initialized")
  }
  
  async getPaymentStatus(paymentSessionData: any) {
    try {
      const intent = await this.stripe_.paymentIntents.retrieve(
        paymentSessionData.id
      )
      
      switch (intent.status) {
        case "requires_payment_method":
        case "requires_confirmation":
        case "processing":
          return "pending"
        case "requires_action":
          return "requires_more"
        case "canceled":
          return "canceled"
        case "requires_capture":
        case "succeeded":
          return "authorized"
        default:
          return "pending"
      }
    } catch (error) {
      console.error("Error getting payment status:", error)
      return "error"
    }
  }
  
  async initiatePayment(context: any) {
    const { amount, currency_code, resource_id, customer, context: paymentContext } = context
    
    try {
      const intentRequest: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount),
        currency: currency_code,
        capture_method: this.options_.capture ? "automatic" : "manual",
        metadata: {
          resource_id: resource_id || "",
        },
        description: this.options_.payment_description,
      }
      
      if (customer?.email) {
        intentRequest.receipt_email = customer.email
      }
      
      if (this.options_.automatic_payment_methods) {
        intentRequest.automatic_payment_methods = {
          enabled: true,
        }
      }
      
      const intent = await this.stripe_.paymentIntents.create(intentRequest)
      
      return {
        session_data: {
          id: intent.id,
          client_secret: intent.client_secret,
          amount: intent.amount,
          currency: intent.currency,
        },
        update_requests: {
          customer: {
            metadata: {
              stripe_customer_id: intent.customer,
            },
          },
        },
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      throw error
    }
  }
  
  async authorizePayment(paymentSessionData: any, context: any) {
    const status = await this.getPaymentStatus(paymentSessionData)
    
    if (status === "authorized") {
      return {
        status: "authorized",
        data: paymentSessionData,
      }
    }
    
    return {
      status: "error",
      error: "Payment not authorized",
    }
  }
  
  async cancelPayment(paymentSessionData: any) {
    try {
      const intent = await this.stripe_.paymentIntents.cancel(
        paymentSessionData.id
      )
      
      return {
        id: intent.id,
        status: intent.status,
      }
    } catch (error) {
      console.error("Error canceling payment:", error)
      throw error
    }
  }
  
  async capturePayment(paymentSessionData: any) {
    try {
      const intent = await this.stripe_.paymentIntents.capture(
        paymentSessionData.id
      )
      
      return {
        id: intent.id,
        status: intent.status,
      }
    } catch (error) {
      console.error("Error capturing payment:", error)
      throw error
    }
  }
  
  async refundPayment(paymentSessionData: any, refundAmount: number) {
    try {
      const refund = await this.stripe_.refunds.create({
        payment_intent: paymentSessionData.id,
        amount: Math.round(refundAmount),
      })
      
      return {
        id: refund.id,
        status: refund.status,
        amount: refund.amount,
      }
    } catch (error) {
      console.error("Error refunding payment:", error)
      throw error
    }
  }
  
  async retrievePayment(paymentSessionData: any) {
    try {
      const intent = await this.stripe_.paymentIntents.retrieve(
        paymentSessionData.id
      )
      
      return {
        id: intent.id,
        status: intent.status,
        amount: intent.amount,
        currency: intent.currency,
      }
    } catch (error) {
      console.error("Error retrieving payment:", error)
      throw error
    }
  }
  
  async updatePayment(sessionId: string, data: any) {
    try {
      const intent = await this.stripe_.paymentIntents.update(sessionId, {
        amount: Math.round(data.amount),
      })
      
      return {
        session_data: {
          id: intent.id,
          amount: intent.amount,
        },
      }
    } catch (error) {
      console.error("Error updating payment:", error)
      throw error
    }
  }
  
  async deletePayment(paymentSessionData: any) {
    return await this.cancelPayment(paymentSessionData)
  }
}

export default StripeProviderService