/**
 * Cloudflare Worker for Image Transformation
 * This worker handles image resizing and optimization for R2 bucket images
 * 
 * Deploy this to Cloudflare Workers and route it to handle your R2 image URLs
 * Route pattern: https://your-domain.com/cdn-cgi/image/*
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Parse image transformation parameters from URL
  const params = new URLSearchParams(url.search)
  
  // Extract transformation options
  const options = {
    width: params.get('width'),
    height: params.get('height'),
    quality: params.get('quality') || '85',
    format: params.get('format') || 'auto',
    fit: params.get('fit') || 'cover',
    gravity: params.get('gravity') || 'auto',
    sharpen: params.get('sharpen'),
    blur: params.get('blur'),
    dpr: params.get('dpr') || '1'
  }
  
  // Get the original image URL
  // Remove the transformation parameters to get clean URL
  const cleanUrl = url.origin + url.pathname
  
  // Check if this is an R2 URL
  const isR2Url = cleanUrl.includes('r2.dev') || cleanUrl.includes('pub-46371bda6faf4910b74631159fc2dfd4')
  
  if (!isR2Url) {
    // If not an R2 URL, just pass through
    return fetch(cleanUrl)
  }
  
  // Build Cloudflare Image Resizing options
  const cf = {
    image: {}
  }
  
  // Apply width and height
  if (options.width) cf.image.width = parseInt(options.width)
  if (options.height) cf.image.height = parseInt(options.height)
  
  // Apply quality
  cf.image.quality = parseInt(options.quality)
  
  // Apply format
  if (options.format === 'auto') {
    // Auto-detect best format based on Accept header
    const accept = request.headers.get('Accept') || ''
    if (accept.includes('image/avif')) {
      cf.image.format = 'avif'
    } else if (accept.includes('image/webp')) {
      cf.image.format = 'webp'
    } else {
      cf.image.format = 'jpeg'
    }
  } else {
    cf.image.format = options.format
  }
  
  // Apply fit mode
  cf.image.fit = options.fit
  
  // Apply gravity for crop
  if (options.gravity && options.gravity !== 'auto') {
    cf.image.gravity = options.gravity
  }
  
  // Apply sharpen
  if (options.sharpen) {
    cf.image.sharpen = parseFloat(options.sharpen)
  }
  
  // Apply blur
  if (options.blur) {
    cf.image.blur = parseInt(options.blur)
  }
  
  // Apply DPR (Device Pixel Ratio)
  if (options.dpr && options.dpr !== '1') {
    cf.image.dpr = parseFloat(options.dpr)
  }
  
  // Add draw options for advanced transformations
  cf.image.draw = []
  
  // Add background color for transparent images
  if (params.get('background')) {
    cf.image.background = params.get('background')
  }
  
  // Cache control headers
  const cacheTime = 60 * 60 * 24 * 365 // 1 year
  
  try {
    // Fetch the original image with transformation options
    const imageResponse = await fetch(cleanUrl, {
      cf: cf
    })
    
    // Check if the request was successful
    if (!imageResponse.ok) {
      return new Response('Image not found', { status: 404 })
    }
    
    // Get the transformed image
    const transformedImage = await imageResponse.arrayBuffer()
    
    // Determine content type based on format
    let contentType = 'image/jpeg'
    if (cf.image.format === 'webp') contentType = 'image/webp'
    if (cf.image.format === 'avif') contentType = 'image/avif'
    if (cf.image.format === 'png') contentType = 'image/png'
    
    // Return the transformed image with appropriate headers
    return new Response(transformedImage, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': `public, max-age=${cacheTime}, immutable`,
        'Vary': 'Accept',
        // Add CORS headers if needed
        'Access-Control-Allow-Origin': '*',
        // Add performance hints
        'X-Content-Type-Options': 'nosniff',
        // Add custom header to indicate transformation
        'X-Image-Transform': 'cloudflare-worker',
        // Add timing header for debugging
        'X-Transform-Options': JSON.stringify(options)
      }
    })
  } catch (error) {
    // Log error for debugging
    console.error('Image transformation error:', error)
    
    // Fallback to original image
    return fetch(cleanUrl)
  }
}

/**
 * Alternative implementation using Cloudflare Images API
 * Use this if you have Cloudflare Images subscription
 */
async function handleWithCloudflareImages(request) {
  const url = new URL(request.url)
  const params = new URLSearchParams(url.search)
  
  // Your Cloudflare Images account details
  const ACCOUNT_ID = 'your-account-id'
  const IMAGES_DELIVERY_URL = `https://imagedelivery.net/${ACCOUNT_ID}`
  
  // Extract image ID from URL
  const imagePath = url.pathname
  const imageId = imagePath.split('/').pop()?.replace(/\.[^.]+$/, '') // Remove file extension
  
  // Build variant string based on parameters
  const width = params.get('width') || ''
  const height = params.get('height') || ''
  const fit = params.get('fit') || 'cover'
  const quality = params.get('quality') || '85'
  
  // Create variant identifier
  const variant = `w${width}_h${height}_${fit}_q${quality}`
  
  // Build Cloudflare Images URL
  const cfImagesUrl = `${IMAGES_DELIVERY_URL}/${imageId}/${variant}`
  
  // Fetch from Cloudflare Images
  return fetch(cfImagesUrl)
}

/**
 * Health check endpoint
 */
async function handleHealthCheck() {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'image-transform-worker',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}