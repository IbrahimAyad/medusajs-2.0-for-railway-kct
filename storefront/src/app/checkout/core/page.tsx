'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CoreCheckoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to Medusa checkout since we're no longer using Core cart
    router.replace('/checkout-medusa')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-2">Redirecting to checkout...</div>
      </div>
    </div>
  )
}