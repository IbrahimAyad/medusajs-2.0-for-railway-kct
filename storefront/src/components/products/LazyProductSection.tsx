'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'

interface LazyProductSectionProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
}

export default function LazyProductSection({ 
  children, 
  fallback = <div className="min-h-[400px] animate-pulse bg-gray-100" />,
  rootMargin = '100px',
  threshold = 0.1
}: LazyProductSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Once visible, disconnect observer to prevent re-rendering
          if (ref.current) {
            observer.unobserve(ref.current)
          }
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [rootMargin, threshold])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}