'use client'

import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { MedusaCartProvider } from '@/contexts/MedusaCartContext'

export default function MedusaCheckoutPage() {
  return (
    <MedusaCartProvider>
      <div className="min-h-screen bg-white">
        <CheckoutForm />
      </div>
    </MedusaCartProvider>
  )
}