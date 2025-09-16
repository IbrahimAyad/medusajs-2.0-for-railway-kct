'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Package } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  sizes?: string
}

export default function ProductImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority = false,
  sizes
}: ProductImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Placeholder when no image or error
  const placeholder = (
    <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
      <div className="text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No Image</p>
      </div>
    </div>
  )

  // If no src or error occurred, show placeholder
  if (!src || error) {
    return placeholder
  }

  return (
    <>
      {loading && placeholder}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        onLoad={() => setLoading(false)}
        priority={priority}
        sizes={sizes}
      />
    </>
  )
}