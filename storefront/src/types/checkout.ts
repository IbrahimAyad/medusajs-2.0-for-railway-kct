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
  quantity: number
  subtotal?: number
  total?: number
  original_total?: number
  discount_total?: number
  tax_total?: number
}

export interface ShippingMethod extends HttpTypes.StoreCartShippingMethod {
  id: string
  name: string
  amount: number
  is_tax_inclusive?: boolean
}

export interface PaymentSession {
  id: string
  amount: number
  currency_code: string
  provider_id: string
  status: "pending" | "authorized" | "captured" | "canceled" | "error" | "requires_more"
  data?: Record<string, any>
}

export interface Cart extends HttpTypes.StoreCart {
  id: string
  email?: string
  currency_code: string
  region?: HttpTypes.StoreRegion
  items?: CartLineItem[]
  shipping_address?: CartAddress
  billing_address?: CartAddress
  shipping_methods?: ShippingMethod[]
  payment_collection?: {
    id: string
    amount: number
    currency_code: string
    payment_sessions?: PaymentSession[]
  }
  subtotal?: number
  tax_total?: number
  shipping_total?: number
  discount_total?: number
  gift_card_total?: number
  total?: number
}

// Payment Types
export interface PaymentMethod {
  id: string
  provider_id: string
  name: string
  description?: string
  is_enabled: boolean
}

export interface PaymentFormData {
  provider_id: string
  data?: Record<string, any>
}

// Order Types
export interface OrderAddress extends CartAddress {
  id: string
}

export interface OrderLineItem extends CartLineItem {
  id: string
  order_id: string
  fulfilled_quantity?: number
  returned_quantity?: number
}

export interface Order extends HttpTypes.StoreOrder {
  id: string
  status: "pending" | "confirmed" | "shipped" | "delivered" | "canceled" | "refunded"
  email: string
  currency_code: string
  items: OrderLineItem[]
  shipping_address: OrderAddress
  billing_address: OrderAddress
  shipping_methods: ShippingMethod[]
  payment_status: "pending" | "paid" | "refunded" | "partially_refunded"
  fulfillment_status: "pending" | "fulfilled" | "partially_fulfilled" | "canceled"
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  created_at: string
  updated_at: string
}

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