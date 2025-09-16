'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import analytics components with no SSR
const GoogleAnalytics = dynamic(
  () => import('./GoogleAnalytics').then(mod => mod.GoogleAnalytics),
  { ssr: false }
)

const FacebookPixel = dynamic(
  () => import('./FacebookPixel').then(mod => mod.FacebookPixel),
  { ssr: false }
)

interface ClientOnlyAnalyticsProps {
  children?: React.ReactNode
}

export function ClientOnlyAnalytics({ children }: ClientOnlyAnalyticsProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything on server
  if (!mounted) {
    return null
  }

  return (
    <>
      <GoogleAnalytics />
      <FacebookPixel />
      {children}
    </>
  )
}