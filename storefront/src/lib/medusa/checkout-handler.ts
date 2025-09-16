import { medusa, MEDUSA_CONFIG } from './client'
import { cartAdapter } from './cart-adapter'

interface CheckoutData {
  email: string
  shippingAddress: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
    phone?: string
  }
  billingAddress?: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    province?: string
    postal_code: string
    country_code: string
  }
}

export class CheckoutHandler {
  /**
   * Complete checkout process with order-first approach (primary), then fallback to bypass
   */
  async processCheckout(checkoutData: CheckoutData) {
    try {
      const cart = cartAdapter.getCart()
      if (!cart?.id) {
        throw new Error('No cart available for checkout')
      }

      // Step 1: Add customer email
      await cartAdapter.setCustomerEmail(checkoutData.email)

      // Step 2: Add shipping address
      await cartAdapter.setShippingAddress(checkoutData.shippingAddress)

      // Step 3: Add billing address (use shipping if not provided)
      const billingAddress = checkoutData.billingAddress || {
        ...checkoutData.shippingAddress,
        phone: undefined, // billing doesn't need phone
      }

      await medusa.store.cart.update(cart.id, {
        billing_address: billingAddress,
      })

      // Step 4: List available shipping options
      const shippingOptions = await medusa.store.shipping.listCartOptions(cart.id)
      
      // Step 5: Select first available shipping option
      if (shippingOptions.length > 0) {
        await medusa.store.cart.addShippingMethod(cart.id, {
          option_id: shippingOptions[0].id,
        })
      }

      // Step 6: Try order-first checkout endpoint first (primary method)
      try {
        console.log('Attempting order-first checkout (primary method)...')
        const orderFirstResult = await this.createOrderFirstPayment(cart.id, checkoutData.email, checkoutData.shippingAddress, billingAddress)
        
        if (orderFirstResult.success) {
          console.log('✅ Order-first checkout created successfully')
          return {
            success: true,
            cartId: cart.id,
            clientSecret: orderFirstResult.clientSecret,
            paymentIntentId: orderFirstResult.paymentIntentId,
            orderId: orderFirstResult.orderId,
            method: 'order_first'
          }
        } else {
          throw new Error(orderFirstResult.error || 'Order-first checkout failed')
        }
      } catch (orderFirstError) {
        console.warn('Order-first checkout failed, attempting bypass fallback:', orderFirstError)
        
        // Fallback to bypass Stripe payment (only if order-first fails)
        const bypassResult = await this.createDirectStripePayment(cart.id, checkoutData.email, checkoutData.shippingAddress, billingAddress)
        
        if (bypassResult.success) {
          console.log('✅ Bypass Stripe payment created successfully')
          return {
            success: true,
            cartId: cart.id,
            clientSecret: bypassResult.clientSecret,
            paymentIntentId: bypassResult.paymentIntentId,
            method: 'bypass_stripe'
          }
        } else {
          throw new Error(bypassResult.error || 'Both order-first and bypass payment failed')
        }
      }
    } catch (error) {
      console.error('Checkout failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
      }
    }
  }

  /**
   * Create order-first payment (primary method with proper tax calculation)
   */
  async createOrderFirstPayment(
    cartId: string, 
    email: string, 
    shippingAddress: any, 
    billingAddress: any
  ) {
    try {
      console.log('🎯 Creating order-first payment...')
      
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

      console.log('🔑 Using publishable key:', publishableKey.substring(0, 20) + '...');
      console.log('🔗 Calling endpoint:', `${MEDUSA_CONFIG.baseUrl}/store/checkout/create-order`);

      if (!publishableKey || !publishableKey.startsWith('pk_')) {
        console.error('Invalid publishable key:', publishableKey);
        throw new Error('Invalid or missing Medusa publishable key');
      }
      
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/store/checkout/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          cart_id: cartId,
          customer_email: email,
          shipping_address: shippingAddress,
          billing_address: billingAddress
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Order-first payment failed: ${response.status}`);
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Order-first payment failed - no client secret')
      }

      return {
        success: true,
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
        orderId: data.order_id,
        amount: data.amount,
        currency: data.currency
      }
    } catch (error) {
      console.error('Order-first payment creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order-first payment creation failed'
      }
    }
  }

  /**
   * Create direct Stripe payment (bypass Medusa payment system - fallback only)
   */
  async createDirectStripePayment(
    cartId: string, 
    email: string, 
    shippingAddress: any, 
    billingAddress: any
  ) {
    try {
      console.log('🚀 Creating bypass Stripe payment (fallback)...')
      
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81';

      console.log('🔑 Using publishable key:', publishableKey.substring(0, 20) + '...');
      console.log('🔗 Calling endpoint:', `${MEDUSA_CONFIG.baseUrl}/stripe-bypass`);

      if (!publishableKey || !publishableKey.startsWith('pk_')) {
        console.error('Invalid publishable key:', publishableKey);
        throw new Error('Invalid or missing Medusa publishable key');
      }
      
      const response = await fetch(`${MEDUSA_CONFIG.baseUrl}/stripe-bypass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': publishableKey,
        },
        body: JSON.stringify({
          cart_id: cartId,
          customer_email: email,
          shipping_address: shippingAddress,
          billing_address: billingAddress
        })
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Request failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Bypass payment failed: ${response.status}`);
      }

      const data = await response.json()
      
      if (!data.success || !data.client_secret) {
        throw new Error(data.error || 'Bypass payment failed - no client secret')
      }

      return {
        success: true,
        clientSecret: data.client_secret,
        paymentIntentId: data.payment_intent_id,
        amount: data.amount,
        currency: data.currency
      }
    } catch (error) {
      console.error('Bypass Stripe payment creation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bypass payment creation failed'
      }
    }
  }

  /**
   * Complete the payment after Stripe confirmation
   */
  async completePayment(cartId: string) {
    try {
      // Complete the cart which creates an order
      const result = await medusa.store.cart.complete(cartId)
      
      // DISABLED: Cart deletion moved to after order confirmation
      // const cartStore = (await import('@/lib/store/cartStore')).useCartStore.getState()
      // cartStore.clearCart()
      
      // DISABLED: Cart deletion moved to after order confirmation  
      // if (typeof window !== 'undefined') {
      //   localStorage.removeItem('medusa_cart_id')
      // }

      return {
        success: true,
        order: result.order,
        orderId: result.order?.id,
      }
    } catch (error) {
      console.error('Payment completion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment completion failed',
      }
    }
  }

  /**
   * Create checkout session for redirect (alternative to embedded)
   */
  async createCheckoutUrl(email?: string) {
    try {
      const cart = cartAdapter.getCart()
      if (!cart?.id) {
        throw new Error('No cart available for checkout')
      }

      // Add email if provided
      if (email) {
        await cartAdapter.setCustomerEmail(email)
      }

      // For Medusa 2.0, we use payment links
      // This creates a shareable checkout link
      const checkoutUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/checkout/${cart.id}`

      return {
        success: true,
        url: checkoutUrl,
        cartId: cart.id,
      }
    } catch (error) {
      console.error('Failed to create checkout URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create checkout',
      }
    }
  }
}

export const checkoutHandler = new CheckoutHandler()