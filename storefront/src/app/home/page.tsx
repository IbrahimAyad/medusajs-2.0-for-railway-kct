import Link from 'next/link'
import { ShoppingBag, Truck, Shield, CreditCard } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              KCT Menswear
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Premium Suits, Tuxedos, Vests & Accessories
            </p>
            <div className="space-x-4">
              <Link 
                href="/kct-shop" 
                className="inline-block px-8 py-4 bg-white text-black rounded hover:bg-gray-100 transition-colors font-semibold"
              >
                Shop Collection
              </Link>
              <Link 
                href="/about" 
                className="inline-block px-8 py-4 border border-white text-white rounded hover:bg-white hover:text-black transition-colors font-semibold"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-black" />
            <h3 className="font-semibold mb-2">204 Products</h3>
            <p className="text-gray-600 text-sm">
              Complete collection of formal wear
            </p>
          </div>
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-black" />
            <h3 className="font-semibold mb-2">Free Shipping</h3>
            <p className="text-gray-600 text-sm">
              On US orders over $100
            </p>
          </div>
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-black" />
            <h3 className="font-semibold mb-2">30-Day Returns</h3>
            <p className="text-gray-600 text-sm">
              Easy returns and exchanges
            </p>
          </div>
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-black" />
            <h3 className="font-semibold mb-2">Secure Checkout</h3>
            <p className="text-gray-600 text-sm">
              Powered by Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/kct-shop" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">Suits</span>
                </div>
                <div className="p-4">
                  <p className="text-center text-gray-600">Classic & Modern Fits</p>
                </div>
              </div>
            </Link>
            
            <Link href="/kct-shop" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">Tuxedos</span>
                </div>
                <div className="p-4">
                  <p className="text-center text-gray-600">Black Tie Excellence</p>
                </div>
              </div>
            </Link>
            
            <Link href="/kct-shop" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">Vests</span>
                </div>
                <div className="p-4">
                  <p className="text-center text-gray-600">Multiple Colors</p>
                </div>
              </div>
            </Link>
            
            <Link href="/kct-shop" className="group">
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="text-white text-2xl font-semibold">Accessories</span>
                </div>
                <div className="p-4">
                  <p className="text-center text-gray-600">Complete Your Look</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Style?</h2>
          <p className="text-xl mb-8 text-gray-300">
            Browse our complete collection of premium menswear
          </p>
          <Link 
            href="/kct-shop" 
            className="inline-block px-8 py-4 bg-white text-black rounded hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}