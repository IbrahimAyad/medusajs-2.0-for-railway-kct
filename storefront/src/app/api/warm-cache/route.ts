// Cache warming endpoint to pre-load products into cache
// This can be called after deployment or on a schedule

import { NextRequest, NextResponse } from 'next/server'

const MEDUSA_URL = 'https://backend-production-7441.up.railway.app'

// Get API headers
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const results: any[] = []
  
  try {
    console.log('[Cache Warming] Starting cache warm process...')
    
    // Warm different batch sizes in parallel
    const warmingRequests = [
      // Primary sizes used by the app
      { limit: 40, offset: 0, priority: 'high' },
      { limit: 40, offset: 40, priority: 'high' },
      { limit: 40, offset: 80, priority: 'medium' },
      
      // Alternative batch sizes
      { limit: 30, offset: 0, priority: 'medium' },
      { limit: 50, offset: 0, priority: 'low' },
      { limit: 100, offset: 0, priority: 'low' },
    ]
    
    // Execute warming requests in parallel
    const warmingPromises = warmingRequests.map(async (req) => {
      const requestStart = Date.now()
      
      try {
        const params = new URLSearchParams({
          limit: req.limit.toString(),
          offset: req.offset.toString()
        })
        
        const response = await fetch(`${MEDUSA_URL}/store/products?${params}`, {
          method: 'GET',
          headers: getHeaders()
        })
        
        if (!response.ok) {
          throw new Error(`Failed: ${response.status}`)
        }
        
        const data = await response.json()
        const duration = Date.now() - requestStart
        
        return {
          success: true,
          limit: req.limit,
          offset: req.offset,
          priority: req.priority,
          productsCount: data.products?.length || 0,
          duration: `${duration}ms`,
          cached: duration < 500 // If it's fast, it was likely cached
        }
      } catch (error) {
        return {
          success: false,
          limit: req.limit,
          offset: req.offset,
          priority: req.priority,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: `${Date.now() - requestStart}ms`
        }
      }
    })
    
    // Wait for all warming requests to complete
    const warmingResults = await Promise.allSettled(warmingPromises)
    
    // Process results
    warmingResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          success: false,
          error: result.reason
        })
      }
    })
    
    // Calculate statistics
    const totalDuration = Date.now() - startTime
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length
    const cachedCount = results.filter(r => r.cached).length
    
    console.log('[Cache Warming] Completed in', totalDuration, 'ms')
    console.log(`[Cache Warming] Success: ${successCount}, Failed: ${failureCount}, Already Cached: ${cachedCount}`)
    
    return NextResponse.json({
      success: true,
      message: 'Cache warming completed',
      statistics: {
        totalDuration: `${totalDuration}ms`,
        requestsTotal: results.length,
        requestsSuccess: successCount,
        requestsFailed: failureCount,
        alreadyCached: cachedCount
      },
      results: results.sort((a, b) => {
        // Sort by priority then by offset
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 3
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 3
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority
        }
        return (a.offset || 0) - (b.offset || 0)
      })
    })
    
  } catch (error) {
    console.error('[Cache Warming] Error:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Cache warming failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Date.now() - startTime}ms`
    }, { status: 500 })
  }
}

// POST endpoint for manual cache warming with custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limits = [40], offsets = [0] } = body
    
    console.log('[Cache Warming] Manual warming with limits:', limits, 'offsets:', offsets)
    
    const warmingPromises = []
    
    for (const limit of limits) {
      for (const offset of offsets) {
        warmingPromises.push(
          fetch(`${MEDUSA_URL}/store/products?limit=${limit}&offset=${offset}`, {
            method: 'GET',
            headers: getHeaders()
          })
        )
      }
    }
    
    await Promise.allSettled(warmingPromises)
    
    return NextResponse.json({
      success: true,
      message: `Warmed cache for ${warmingPromises.length} combinations`
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}