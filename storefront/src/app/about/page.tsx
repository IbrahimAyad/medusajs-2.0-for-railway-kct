import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/kct-shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>
        
        <h1 className="text-4xl font-bold mb-8">About KCT Menswear</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-xl text-gray-700 mb-6">
            Premium men's formal wear for every occasion.
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Collection</h2>
            <p className="text-gray-600 mb-4">
              KCT Menswear offers over 200 premium products including:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• Suits - Classic, modern, and slim fit options</li>
              <li>• Tuxedos - For black-tie events and weddings</li>
              <li>• Vests - Available in multiple colors and sizes</li>
              <li>• Accessories - Ties, bow ties, pocket squares, and more</li>
            </ul>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Size Range</h2>
            <p className="text-gray-600">
              We cater to all body types with sizes ranging from XS to 6XL, ensuring everyone finds their perfect fit.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Quality Guarantee</h2>
            <p className="text-gray-600">
              Every piece in our collection is crafted with attention to detail and quality materials, backed by our 30-day return policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Shipping & Returns</h2>
            <ul className="space-y-2 text-gray-600">
              <li>• Free shipping on US orders over $100</li>
              <li>• International shipping available for $40</li>
              <li>• 30-day return policy</li>
              <li>• Easy exchanges for sizing</li>
            </ul>
          </section>
          
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Ready to Shop?</h3>
            <p className="text-gray-600 mb-4">
              Browse our complete collection of premium menswear.
            </p>
            <Link 
              href="/kct-shop" 
              className="inline-block px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}