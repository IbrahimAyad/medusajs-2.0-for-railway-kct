'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ShopRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the main KCT shop
    router.replace('/kct-shop')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl">Redirecting to shop...</p>
      </div>
    </div>
  )
}