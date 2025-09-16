'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useMedusaCart } from '@/hooks/useMedusaCart'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/lib/types'

// Mint Vest & Tie product data - formatted as Product type
const product: Product = {
  id: 'prod_005c0708a48e4e1d',
  name: 'Mint Vest & Tie Set',
  title: 'Mint Vest & Tie Set',
  description: 'Elevate your formal attire with our elegant mint vest and tie set. Perfect for weddings, proms, and special occasions. The refreshing mint color adds a modern touch to any suit.',
  price: 4999, // $49.99 in cents
  images: [
    'https://funkyton.com/cdn/shop/products/mint-vest-tie.jpg?v=1637102894'
  ],
  category: 'Accessories',
  variants: [
    { id: 'var_mint_vest_xs', size: 'XS', stock: 10, price: 4999 },
    { id: 'var_mint_vest_s', size: 'S', stock: 10, price: 4999 },
    { id: 'var_mint_vest_m', size: 'M', stock: 10, price: 4999 },
    { id: 'var_mint_vest_l', size: 'L', stock: 10, price: 4999 },
    { id: 'var_mint_vest_xl', size: 'XL', stock: 10, price: 4999 },
    { id: 'var_mint_vest_2xl', size: '2XL', stock: 10, price: 4999 },
    { id: 'var_mint_vest_3xl', size: '3XL', stock: 10, price: 4999 },
    { id: 'var_mint_vest_4xl', size: '4XL', stock: 0, price: 4999 },
    { id: 'var_mint_vest_5xl', size: '5XL', stock: 10, price: 4999 }
  ],
  slug: 'mint-vest-tie-set',
  inStock: true
}

const sizeLabels: Record<string, string> = {
  'XS': 'XS',
  'S': 'Small',
  'M': 'Medium',
  'L': 'Large',
  'XL': 'XL',
  '2XL': '2XL',
  '3XL': '3XL',
  '4XL': '4XL',
  '5XL': '5XL'
}

export default function MintVestProductPage() {
  const router = useRouter()
  const { addItem, isLoading: cartLoading } = useMedusaCart()
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddToCart = async () => {
    if (!selectedSize) {
      setError('Please select a size')
      return
    }

    setIsAdding(true)
    setError(null)
    setAddSuccess(false)

    try {
      // Find the variant for the selected size
      const variant = product.variants.find(v => v.size === selectedSize)
      if (!variant) {
        throw new Error('Invalid size selected')
      }

      // Use the addItem method with variant ID
      const result = await addItem(product, variant.id, quantity)

      if (result.success) {
        setAddSuccess(true)
        
        // Reset after 2 seconds
        setTimeout(() => {
          setAddSuccess(false)
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to add to cart')
      }
    } catch (err: any) {
      console.error('Add to cart error:', err)
      setError(err?.message || 'Failed to add to cart')
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    if (!error) {
      router.push('/cart')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span>/</span>
          <Link href="/products-test" className="hover:text-gray-900">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              <p className="text-2xl font-semibold text-blue-600">
                ${(product.price).toFixed(2)}
              </p>
            </div>

            <p className="text-gray-600">
              {product.description}
            </p>

            {/* Size Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.size}
                    onClick={() => setSelectedSize(variant.size)}
                    disabled={variant.stock === 0}
                    className={`
                      relative py-3 px-4 border rounded-lg text-sm font-medium transition-all
                      ${variant.stock === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                        : selectedSize === variant.size
                        ? 'border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600'
                        : 'border-gray-300 text-gray-900 hover:border-gray-400 bg-white'
                      }
                    `}
                  >
                    {sizeLabels[variant.size] || variant.size}
                    {variant.stock === 0 && (
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400">
                        <span className="block w-full h-px bg-gray-400 rotate-45"></span>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {addSuccess && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Added to cart!</p>
                  <Link href="/cart" className="underline hover:no-underline">
                    View cart
                  </Link>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || cartLoading || !selectedSize}
                className="flex-1 py-3 px-6 bg-white border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {isAdding ? (
                  'Adding...'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isAdding || cartLoading || !selectedSize}
                className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Buy Now
              </button>
            </div>

            {/* Product Features */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Product Features</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-600">Premium mint colored fabric</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-600">Matching vest and tie</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-600">Adjustable back strap</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-600">Perfect for formal events</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-600">Available in sizes XS to 5XL</span>
                </li>
              </ul>
            </div>

            {/* Shipping Info */}
            <div className="border-t pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Free Shipping</span>
                  <span className="text-gray-600">on orders over $100</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Easy Returns</span>
                  <span className="text-gray-600">30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}