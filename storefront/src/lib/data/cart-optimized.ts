"use server"

import { revalidateTag } from "next/cache"

// Optimized revalidation with debouncing
let revalidationTimer: NodeJS.Timeout | null = null

export function scheduleCartRevalidation(delay: number = 500) {
  if (revalidationTimer) {
    clearTimeout(revalidationTimer)
  }

  revalidationTimer = setTimeout(() => {
    revalidateTag("cart")
    revalidationTimer = null
  }, delay)
}

// Immediate revalidation for critical operations
export function immediateCartRevalidation() {
  if (revalidationTimer) {
    clearTimeout(revalidationTimer)
    revalidationTimer = null
  }
  revalidateTag("cart")
}