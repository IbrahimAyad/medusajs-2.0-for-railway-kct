'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary for Knowledge Bank features
 * Prevents crashes from API failures or data processing errors
 */
export class KnowledgeBankErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Knowledge Bank Error:', error);
      console.error('Error Info:', errorInfo);
    }

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {this.props.feature 
                  ? `${this.props.feature} temporarily unavailable`
                  : 'Feature temporarily unavailable'}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                We're having trouble loading recommendations right now. 
                Please try again later or continue browsing.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Error details (development only)
                  </summary>
                  <pre className="mt-1 text-xs text-red-600 overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook version for functional components
 */
export function useKnowledgeBankErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('Knowledge Bank error:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

/**
 * Wrapper for async Knowledge Bank operations
 */
export async function withKnowledgeBankErrorHandling<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Knowledge Bank error${context ? ` in ${context}` : ''}:`, error);
    }
    return fallback;
  }
}