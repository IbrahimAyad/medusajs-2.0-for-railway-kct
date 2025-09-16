// TEMPORARILY SIMPLIFIED - Supabase auth disabled during migration to Medusa
import { NextResponse, type NextRequest } from 'next/server'
import redirectsConfig from '../301-redirects.json'
import { isCoreProductRoute, isMedusaProductRoute } from '@/lib/config/product-routing'

// Create redirect maps for faster lookups
const redirectMap = new Map<string, string>();
const patternRedirects: Array<{ pattern: RegExp; target: string }> = [];

// Initialize redirect mappings
redirectsConfig.redirects.forEach(category => {
  category.mappings.forEach(mapping => {
    if ('pattern' in mapping && mapping.pattern) {
      const pattern = new RegExp(mapping.old.replace('*', '.*'));
      patternRedirects.push({ pattern, target: mapping.new });
    } else {
      redirectMap.set(mapping.old, mapping.new);
    }
  });
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Check for 301 redirects first
  if (redirectMap.has(pathname)) {
    const newUrl = redirectMap.get(pathname)!;
    return NextResponse.redirect(new URL(newUrl, request.url), 301);
  }
  
  // Check for pattern-based redirects
  for (const { pattern, target } of patternRedirects) {
    if (pattern.test(pathname)) {
      const newUrl = pathname.replace(pattern, target);
      return NextResponse.redirect(new URL(newUrl, request.url), 301);
    }
  }

  // PRODUCT ROUTING GUARDS
  // Add headers to indicate product type for the app router
  const response = NextResponse.next()
  
  if (isCoreProductRoute(pathname)) {
    // Mark as core product route - should NOT use Medusa
    response.headers.set('x-product-type', 'core')
    
    // Special handling for suit detail pages that were hijacked
    if (pathname.startsWith('/products/suits/') && !pathname.includes('prod_')) {
      // This is a core suit route, not a Medusa product
      response.headers.set('x-core-suit', 'true')
    }
  } else if (isMedusaProductRoute(pathname)) {
    // Mark as Medusa product route
    response.headers.set('x-product-type', 'medusa')
  }

  // Auth functionality disabled during migration
  // Just pass through all requests with headers
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}