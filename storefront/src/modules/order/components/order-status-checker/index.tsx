"use client"

import { useState, useEffect } from "react"
import { Spinner } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

type OrderStatusCheckerProps = {
  cartId?: string
  orderId?: string
  onOrderVerified?: () => void
}

export default function OrderStatusChecker({ 
  cartId, 
  orderId,
  onOrderVerified 
}: OrderStatusCheckerProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [checkAttempts, setCheckAttempts] = useState(0)
  const [orderFound, setOrderFound] = useState(false)
  
  useEffect(() => {
    if (!cartId) {
      console.log("[Order Status] No cart ID provided, skipping verification")
      return
    }

    const checkOrder = async () => {
      if (checkAttempts >= 10) {
        console.log("[Order Status] Max attempts reached, stopping checks")
        setIsChecking(false)
        return
      }

      setIsChecking(true)
      
      try {
        // TODO: Replace with actual endpoint when backend is ready
        // const response = await fetch(`/api/store/orders/check?cart_id=${cartId}`)
        // const data = await response.json()
        
        // For now, just log the attempt
        console.log(`[Order Status] Check attempt ${checkAttempts + 1} for cart: ${cartId}`)
        
        // Simulate checking (remove this when real endpoint is ready)
        const simulatedFound = false // Will be replaced with actual check
        
        if (simulatedFound) {
          console.log("[Order Status] Order verified successfully!")
          setOrderFound(true)
          setIsChecking(false)
          onOrderVerified?.()
          
          // Remove cart from cookies after successful verification
          // This will be done via server action later
        } else {
          // Try again after 1 second
          setTimeout(() => {
            setCheckAttempts(prev => prev + 1)
          }, 1000)
        }
      } catch (error) {
        console.error("[Order Status] Error checking order:", error)
        setTimeout(() => {
          setCheckAttempts(prev => prev + 1)
        }, 2000)
      }
    }

    checkOrder()
  }, [cartId, checkAttempts, onOrderVerified])

  if (!cartId || orderFound || checkAttempts >= 10) {
    return null
  }

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 p-4 bg-ui-bg-subtle rounded-lg">
        <Spinner className="animate-spin" />
        <Text className="text-ui-fg-subtle">
          Verifying your order... (Attempt {checkAttempts + 1}/10)
        </Text>
      </div>
    )
  }

  return null
}