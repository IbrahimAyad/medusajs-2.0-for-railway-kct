import { HttpTypes } from "@medusajs/types"

// Cart Types
export interface CartAddress {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  country_code: string
  postal_code: string
  phone?: string
  company?: string
  province?: string
}

export interface CartLineItem extends HttpTypes.StoreCartLineItem {
  product?: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}

export interface ShippingMethod extends HttpTypes.StoreCartShippingMethod {
  // Additional properties already included in base type
}

export interface PaymentSession {
  id: string
  amount: number
  currency_code: string
  provider_id: string
  status: "pending" | "authorized" | "captured" | "canceled" | "error" | "requires_more"
  data?: Record<string, any>
}

export type Cart = HttpTypes.StoreCart

// Payment Types
export interface PaymentMethod {
  id: string           // This is the provider ID from API (e.g., pp_stripe_stripe)
  is_enabled: boolean
  name?: string        // Optional as API doesn't return it
  description?: string // Optional as API doesn't return it
}

export interface PaymentFormData {
  provider_id: string
  data?: Record<string, any>
}

// Order Types
export type Order = HttpTypes.StoreOrder
export type OrderLineItem = HttpTypes.StoreOrderLineItem

// Form Types
export interface AddressFormData {
  shipping_address: CartAddress
  billing_address?: CartAddress
  same_as_shipping?: boolean
  email?: string
}

export interface ShippingFormData {
  shipping_method_id: string
}

// Component Props Types
export interface CheckoutSummaryProps {
  cart: Cart
}

export interface PaymentProps {
  cart: Cart
  availablePaymentMethods: PaymentMethod[]
}

export interface ReviewProps {
  cart: Cart
}

export interface AddressesProps {
  cart: Cart
  formData?: AddressFormData
}

export interface ShippingProps {
  cart: Cart
  availableShippingMethods: ShippingMethod[]
}

export interface PaymentButtonProps {
  cart: Cart
  notReady: boolean
  className?: string
}

export interface DiscountCodeProps {
  cart: Cart
}

// Utility Types
export type CheckoutStep = "address" | "delivery" | "payment" | "review"

export interface CheckoutState {
  currentStep: CheckoutStep
  isProcessing: boolean
  error?: string
}