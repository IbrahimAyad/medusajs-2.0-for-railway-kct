import { HttpTypes } from "@medusajs/types"

export interface CustomerAddress {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  province?: string
  country_code: string
  phone?: string
}

export interface ActionResult {
  success: boolean
  error: string | null
}

export interface CustomerFormState {
  addressId?: string
  [key: string]: unknown
}