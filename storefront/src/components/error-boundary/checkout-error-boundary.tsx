"use client"

import React from "react"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { ErrorBoundary } from "./index"
import { useRouter } from "next/navigation"

interface CheckoutErrorBoundaryProps {
  children: React.ReactNode
}

const CheckoutErrorFallback = () => {
  const router = useRouter()

  const handleReturnToCart = () => {
    router.push("/cart")
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <Container className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <Heading level="h2" className="text-ui-fg-base">
          Checkout Error
        </Heading>
        <Text className="text-ui-fg-subtle">
          We encountered an issue during checkout. Your cart items are safe. Please try again or return to your cart.
        </Text>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={handleReturnToCart}>
            Return to Cart
          </Button>
          <Button onClick={handleReload}>Try Again</Button>
        </div>
      </div>
    </Container>
  )
}

export const CheckoutErrorBoundary: React.FC<CheckoutErrorBoundaryProps> = ({
  children,
}) => {
  const handleCheckoutError = (error: Error) => {
    // Log checkout errors to monitoring service
    if (process.env.NODE_ENV === "production") {
      // Add your error tracking service here (e.g., Sentry)
      console.error("Checkout error:", error)
    }
  }

  return (
    <ErrorBoundary
      fallback={<CheckoutErrorFallback />}
      onError={handleCheckoutError}
    >
      {children}
    </ErrorBoundary>
  )
}

export default CheckoutErrorBoundary