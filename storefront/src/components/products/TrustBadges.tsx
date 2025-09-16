'use client'

import { Truck, Shield, RefreshCw, CreditCard, Award, Users } from 'lucide-react'

interface TrustBadgesProps {
  className?: string
  compact?: boolean
}

export default function TrustBadges({ className = '', compact = false }: TrustBadgesProps) {
  const badges = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over $199',
      color: 'text-blue-600'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '256-bit SSL encryption',
      color: 'text-green-600'
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      description: '30-day return policy',
      color: 'text-purple-600'
    },
    {
      icon: Award,
      title: 'Quality Guarantee',
      description: 'Premium materials only',
      color: 'text-amber-600'
    }
  ]

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-4 ${className}`}>
        {badges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <badge.icon className={`w-4 h-4 ${badge.color}`} />
            <span className="text-gray-700">{badge.title}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {badges.map((badge, i) => (
        <div key={i} className="text-center">
          <div className={`inline-flex p-3 rounded-full bg-gray-50 mb-2 ${badge.color}`}>
            <badge.icon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium mb-1">{badge.title}</h3>
          <p className="text-xs text-gray-600">{badge.description}</p>
        </div>
      ))}
    </div>
  )
}

interface StockUrgencyProps {
  quantity?: number
  viewCount?: number
}

export function StockUrgency({ quantity = 5, viewCount = 12 }: StockUrgencyProps) {
  const isLowStock = quantity <= 5
  const isHighDemand = viewCount > 10

  return (
    <div className="space-y-2">
      {isLowStock && quantity > 0 && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
          <span className="font-medium">Only {quantity} left in stock</span>
        </div>
      )}
      
      {isHighDemand && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{viewCount} people are viewing this</span>
        </div>
      )}
      
      {quantity > 0 && quantity <= 3 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
          <p className="text-sm text-red-800 font-medium">
            Hurry! Only {quantity} {quantity === 1 ? 'item' : 'items'} left
          </p>
          <p className="text-xs text-red-600 mt-1">
            Order in the next 2 hours for same-day processing
          </p>
        </div>
      )}
    </div>
  )
}

export function PaymentMethods() {
  return (
    <div className="flex items-center gap-3 pt-4 border-t">
      <span className="text-xs text-gray-600">We accept:</span>
      <div className="flex gap-2">
        {['visa', 'mastercard', 'amex', 'paypal', 'applepay'].map((method) => (
          <div key={method} className="w-8 h-5 bg-gray-100 rounded flex items-center justify-center">
            <CreditCard className="w-4 h-3 text-gray-400" />
          </div>
        ))}
      </div>
    </div>
  )
}