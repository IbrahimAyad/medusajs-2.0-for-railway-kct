'use client'

import { Heart } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlistStore'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function WishlistIndicator() {
  const [mounted, setMounted] = useState(false)
  const itemCount = useWishlistStore((state) => state.getItemCount())

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Heart className="w-5 h-5" />
      </Link>
    )
  }

  return (
    <Link href="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group">
      <Heart className="w-5 h-5 group-hover:text-red-500 transition-colors" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  )
}