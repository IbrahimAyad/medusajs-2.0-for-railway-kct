'use client'

import { useState } from 'react'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { MedusaCartProvider } from '@/contexts/MedusaCartContext'

export default function CheckoutTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-3xl font-bold mb-4">Professional Order-First Checkout</h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">How This Works (Professional Flow)</h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li><strong>Create Order First:</strong> Order is created in Medusa with "pending_payment" status</li>
                <li><strong>Create Payment Intent:</strong> Stripe Payment Intent created with order_id in metadata</li>
                <li><strong>Customer Pays:</strong> Customer completes payment using the order's client_secret</li>
                <li><strong>Webhook Updates Order:</strong> Webhook looks for order_id and updates existing order to "completed"</li>
              </ol>
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800 font-medium">✅ Result: Orders appear in admin panel immediately, never lose revenue tracking!</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Key Improvements Over Current Flow:</h3>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Orders exist BEFORE payment (like Amazon/Shopify)</li>
                <li>Never lose orders due to cart deletion</li>
                <li>Complete audit trail of all purchase attempts</li>
                <li>Admin can see pending orders immediately</li>
                <li>Webhook only updates status (doesn't create orders)</li>
              </ul>
            </div>
          </div>

          <MedusaCartProvider>
            <CheckoutForm />
          </MedusaCartProvider>
        </div>
      </div>
    </div>
  )
}