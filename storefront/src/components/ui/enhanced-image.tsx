'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface EnhancedImageProps {
  src: string
  alt: string
  fallbackSrc?: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  width?: number
  height?: number
  onError?: () => void
  onLoad?: () => void
}

export default function EnhancedImage({
  src,
  alt,
  fallbackSrc = 'https://via.placeholder.com/400x600/f3f4f6/9ca3af?text=Image+Not+Available',
  className,
  fill = false,
  sizes,
  priority = false,
  width,
  height,
  onError,
  onLoad
}: EnhancedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(true)
    }
    setIsLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  // Common props for Image component
  const imageProps = {
    src: imgSrc,
    alt,
    className: cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      className
    ),
    onError: handleError,
    onLoad: handleLoad,
    priority,
    ...(sizes && { sizes })
  }

  return (
    <>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-100 animate-pulse',
            className
          )} 
        />
      )}
      
      {/* Actual image */}
      {fill ? (
        <Image {...imageProps} fill />
      ) : (
        <Image 
          {...imageProps} 
          width={width || 400} 
          height={height || 600} 
        />
      )}
      
      {/* Error indicator (optional) */}
      {hasError && (
        <div className="absolute top-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded">
          Image unavailable
        </div>
      )}
    </>
  )
}