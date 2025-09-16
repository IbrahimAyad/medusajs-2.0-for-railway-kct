import Link from 'next/link'
import { ArrowLeft, Home, Search, ShoppingBag } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
          
          <Link
            href="/products"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Browse Products
          </Link>
          
          <Link
            href="/collections"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
          >
            <Search className="w-5 h-5" />
            View Collections
          </Link>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@kctmenswear.com" className="text-black hover:underline">
              support@kctmenswear.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// Generate metadata for SEO
export const metadata = {
  title: '404 - Page Not Found | KCT Menswear',
  description: 'The page you are looking for could not be found.',
  robots: 'noindex, nofollow'
}