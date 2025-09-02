"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button, Container, Heading, Text } from "@medusajs/ui"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <Heading level="h2" className="text-ui-fg-base">
              Something went wrong
            </Heading>
            <Text className="text-ui-fg-subtle">
              We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
            </Text>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="w-full mt-4 p-4 bg-ui-bg-subtle rounded-md">
                <summary className="cursor-pointer text-ui-fg-subtle text-sm">
                  Error details (development only)
                </summary>
                <pre className="mt-2 text-xs text-left overflow-auto">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Refresh page
              </Button>
              <Button onClick={this.handleReset}>Try again</Button>
            </div>
          </div>
        </Container>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary