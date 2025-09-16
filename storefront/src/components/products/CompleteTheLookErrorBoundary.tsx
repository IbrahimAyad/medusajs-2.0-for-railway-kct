'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorCount: number
}

export default class CompleteTheLookErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorCount: 0 }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('CompleteTheLook Error:', error)
    return { hasError: true, error, errorCount: 0 }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
    console.error('CompleteTheLook Error Details:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: 'CompleteTheLookErrorBoundary'
    })
    
    // Track error count
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }))
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorCount: 0 })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Too many errors, show minimal UI
      if (this.state.errorCount > 3) {
        return null // Don't show anything if it keeps failing
      }

      // Default error UI
      return (
        <div className="mt-12 border-t pt-12">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Unable to Load Suggestions</h3>
            <p className="text-sm text-gray-600 mb-4">
              We're having trouble loading product suggestions right now.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}