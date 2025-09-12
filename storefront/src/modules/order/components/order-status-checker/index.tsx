"use client"

import { useState, useEffect, useCallback } from "react"
import { Spinner } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useRouter } from "next/navigation"

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
  const [isChecking, setIsChecking] = useState(true)
  const [checkAttempts, setCheckAttempts] = useState(0)
  const [orderFound, setOrderFound] = useState(false)
  const [orderData, setOrderData] = useState<any>(null)
  const router = useRouter()
  
  const checkOrder = useCallback(async () => {
    if (!cartId || checkAttempts >= 10) {
      if (checkAttempts >= 10) {
        console.log("[Order Status] Max attempts reached, stopping checks")
      }
      setIsChecking(false)
      return
    }

    console.log(`[Order Status] Check attempt ${checkAttempts + 1} for cart: ${cartId}`)
    setIsChecking(true)
    
    try {
      // Check with backend for order
      const response = await fetch(`/api/store/orders/check?cart_id=${cartId}`)
      const data = await response.json()
      
      console.log("[Order Status] Backend response:", data)
      
      if (data.order) {
        console.log("[Order Status] Order found!", data.order)
        setOrderFound(true)
        setOrderData(data.order)
        setIsChecking(false)
        onOrderVerified?.()
        
        // Redirect to real order page
        if (data.order.id) {
          setTimeout(() => {
            router.push(`/us/order/confirmed/${data.order.id}`)
          }, 1500)
        }
      } else {
        console.log("[Order Status] Order not found yet, will retry...")
        // Try again after 2 seconds
        setTimeout(() => {
          setCheckAttempts(prev => prev + 1)
        }, 2000)
      }
    } catch (error) {
      console.error("[Order Status] Error checking order:", error)
      // Try again after 3 seconds on error
      setTimeout(() => {
        setCheckAttempts(prev => prev + 1)
      }, 3000)
    }
  }, [cartId, checkAttempts, onOrderVerified, router])
  
  useEffect(() => {
    if (!cartId) {
      console.log("[Order Status] No cart ID provided, skipping verification")
      setIsChecking(false)
      return
    }

    console.log("[Order Status] Starting order verification for cart:", cartId)
    checkOrder()
  }, [checkAttempts]) // Only depend on checkAttempts to trigger retries

  if (!cartId) {
    return null
  }

  if (orderFound) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Text className="text-green-700">
          ✓ Order verified! Redirecting to your order...
        </Text>
      </div>
    )
  }

  if (checkAttempts >= 10) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Text className="text-yellow-700 font-medium">
          Order processing is taking longer than expected
        </Text>
        <Text className="text-yellow-600 text-sm">
          Your payment was successful. You will receive an email confirmation once your order is complete.
        </Text>
      </div>
    )
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