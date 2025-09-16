'use client';

import { useState, useEffect } from 'react';
import { clearProductCache, checkBackendUpdate, monitorBackendUpdate } from '@/utils/cache-clear';

export default function CacheManagerPage() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'clearing' | 'monitoring'>('idle');
  const [message, setMessage] = useState('');
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [monitorInterval, setMonitorInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check backend status on mount
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setStatus('checking');
    setMessage('Checking backend status...');
    
    const isReady = await checkBackendUpdate();
    setBackendReady(isReady);
    
    if (isReady) {
      setMessage('✅ Backend is updated and ready with new pricing structure!');
    } else {
      setMessage('⏳ Backend update pending - still using old structure');
    }
    
    setStatus('idle');
  };

  const handleClearCache = () => {
    setStatus('clearing');
    setMessage('Clearing all product caches...');
    
    clearProductCache();
    
    setMessage('✅ Cache cleared successfully! Refreshing page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const handleStartMonitoring = () => {
    if (monitorInterval) {
      clearInterval(monitorInterval);
      setMonitorInterval(null);
      setStatus('idle');
      setMessage('Monitoring stopped');
      return;
    }

    setStatus('monitoring');
    setMessage('🔄 Monitoring backend for updates (checking every 30 seconds)...');
    
    const interval = monitorBackendUpdate(30000);
    setMonitorInterval(interval);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Cache Manager - Backend Deployment Tool
          </h1>

          <div className="space-y-6">
            {/* Status Display */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Current Status
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Backend Status: {' '}
                  {backendReady === null ? (
                    <span className="text-yellow-600">Checking...</span>
                  ) : backendReady ? (
                    <span className="text-green-600 font-semibold">✅ Updated (New Pricing Active)</span>
                  ) : (
                    <span className="text-orange-600 font-semibold">⏳ Old Structure (Update Pending)</span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Cache TTL: <span className="font-mono">60 seconds</span>
                </p>
                <p className="text-sm text-gray-600">
                  API Endpoint: <span className="font-mono">backend-production-7441.up.railway.app</span>
                </p>
              </div>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`rounded-lg p-4 ${
                message.includes('✅') ? 'bg-green-50 text-green-800' :
                message.includes('⏳') ? 'bg-yellow-50 text-yellow-800' :
                message.includes('🔄') ? 'bg-blue-50 text-blue-800' :
                'bg-gray-50 text-gray-800'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={checkStatus}
                disabled={status !== 'idle'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'checking' ? 'Checking...' : 'Check Backend Status'}
              </button>

              <button
                onClick={handleClearCache}
                disabled={status !== 'idle'}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'clearing' ? 'Clearing...' : 'Clear All Caches'}
              </button>

              <button
                onClick={handleStartMonitoring}
                disabled={status === 'checking' || status === 'clearing'}
                className={`px-6 py-3 ${
                  status === 'monitoring' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {status === 'monitoring' ? 'Stop Monitoring' : 'Start Auto-Monitor'}
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-blue-900">
                Deployment Instructions
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Deploy backend changes to Railway production</li>
                <li>Wait 60 seconds for backend cache to expire</li>
                <li>Click "Check Backend Status" to verify update</li>
                <li>Once status shows "Updated", click "Clear All Caches"</li>
                <li>Alternatively, use "Start Auto-Monitor" to automatically detect and clear</li>
              </ol>
            </div>

            {/* Backend Fix Summary */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-700">
                Backend Fix Applied
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>File:</strong> <code className="bg-gray-200 px-2 py-1 rounded">/backend/src/api/store/products/route.ts</code></p>
                <p><strong>Changes:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Using Medusa 2.0 Remote Query API</li>
                  <li>Including <code>variants.calculated_price.*</code> expansion</li>
                  <li>Adding region context for pricing</li>
                  <li>Returning prices in CENTS from Pricing Module</li>
                </ul>
                <p><strong>Expected Response:</strong></p>
                <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "products": [{
    "price": 19999,  // $199.99 in cents
    "variants": [{
      "calculated_price": {
        "calculated_amount": 19999,
        "currency_code": "usd"
      }
    }]
  }]
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}