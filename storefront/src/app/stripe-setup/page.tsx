'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react'

export default function StripeSetupPage() {
  const [copied, setCopied] = useState<string | null>(null)
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const currentPublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'NOT SET'
  const isKeyValid = currentPublishableKey.startsWith('pk_live_') || currentPublishableKey.startsWith('pk_test_')
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stripe Setup Guide</h1>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Current Issue: Invalid Stripe Key
          </h2>
          
          <div className="bg-red-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-red-700">
              The error <strong>"Invalid API Key provided"</strong> means the Stripe publishable key 
              doesn't match your Stripe account. You need to update it with your actual key.
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Current Key Status:</strong>{' '}
              <span className={isKeyValid ? 'text-green-600' : 'text-red-600'}>
                {isKeyValid ? 'Valid Format' : 'Invalid Format'}
              </span>
            </p>
            <p className="text-sm font-mono bg-gray-100 p-2 rounded">
              {currentPublishableKey.substring(0, 20)}...
            </p>
          </div>
        </Card>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Get Your Stripe Keys</h2>
          
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">1</span>
              <div className="flex-1">
                <p className="mb-2">Open your Stripe Dashboard:</p>
                <a 
                  href="https://dashboard.stripe.com/apikeys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  Open Stripe API Keys <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">2</span>
              <div className="flex-1">
                <p className="mb-2">Copy your <strong>Publishable key</strong> (starts with pk_live_ or pk_test_)</p>
                <div className="bg-gray-100 p-3 rounded text-xs">
                  <p className="font-mono">pk_live_51XXXXX...</p>
                  <p className="text-gray-600 mt-1">This is safe to use in frontend code</p>
                </div>
              </div>
            </li>
            
            <li className="flex items-start gap-3">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">3</span>
              <div className="flex-1">
                <p className="mb-2">Copy your <strong>Secret key</strong> (starts with sk_live_ or sk_test_)</p>
                <div className="bg-yellow-50 p-3 rounded text-xs">
                  <p className="font-mono">sk_live_51XXXXX...</p>
                  <p className="text-yellow-700 mt-1">⚠️ Keep this secret! Only use in server-side code</p>
                </div>
              </div>
            </li>
          </ol>
        </Card>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Update Railway Environment Variables</h2>
          
          <div className="space-y-4">
            <div>
              <p className="mb-2">Add these to your Railway service variables:</p>
              <a 
                href="https://railway.app/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
              >
                Open Railway Dashboard <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <span className="text-green-400 text-sm"># Stripe Configuration</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(
                    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY_HERE\nSTRIPE_SECRET_KEY=YOUR_SECRET_KEY_HERE',
                    'env'
                  )}
                  className="text-gray-400 hover:text-white"
                >
                  {copied === 'env' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <pre className="text-sm">
                <span className="text-blue-400">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</span>=<span className="text-yellow-400">YOUR_PUBLISHABLE_KEY_HERE</span>
                <br />
                <span className="text-blue-400">STRIPE_SECRET_KEY</span>=<span className="text-yellow-400">YOUR_SECRET_KEY_HERE</span>
              </pre>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Important:</strong> After adding these variables, Railway will automatically rebuild and deploy.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Step 3: Verify Payment Works</h2>
          
          <div className="space-y-4">
            <p>After Railway redeploys with your keys:</p>
            
            <ol className="space-y-2 ml-4">
              <li className="text-sm">1. Add a product to cart</li>
              <li className="text-sm">2. Go to checkout</li>
              <li className="text-sm">3. Fill in shipping information</li>
              <li className="text-sm">4. The payment form should now load properly</li>
            </ol>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Test Card:</strong> 4242 4242 4242 4242, any future date, any CVC, any ZIP
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-yellow-50">
          <h3 className="font-semibold mb-2">Still having issues?</h3>
          <ul className="space-y-2 text-sm">
            <li>• Make sure you're using the keys from the correct Stripe account</li>
            <li>• For testing, you can use test keys (pk_test_... and sk_test_...)</li>
            <li>• Check that your domain is added in Stripe Dashboard → Settings → Integration security</li>
            <li>• Ensure Payment Element is enabled in your Stripe account</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}