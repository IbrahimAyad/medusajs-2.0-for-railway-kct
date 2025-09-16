// On-demand revalidation endpoint for ISR
// This allows the backend to trigger cache updates when products change

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Verify the revalidation token
    const headersList = await headers();
    const token = headersList.get("x-revalidate-token");
    const secret = headersList.get("x-revalidation-secret");

    // Check both token types for compatibility
    const validAuth = token === process.env.REVALIDATE_TOKEN || 
                      secret === process.env.REVALIDATION_SECRET;

    if (!validAuth) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { paths, tags, type, handle, path, tag } = body;

    console.log('[Revalidation] Request received:', { type, paths, tags, handle, path, tag });

    // Handle different revalidation types
    if (type === 'product') {
      // Revalidate specific product page
      if (handle) {
        revalidatePath(`/products/medusa/${handle}`);
        console.log(`[Revalidation] Product page revalidated: /products/medusa/${handle}`);
      }
      
      // Also revalidate products list
      revalidateTag('products');
      revalidatePath('/collections');
      console.log('[Revalidation] Products tag and collections revalidated');
      
    } else if (type === 'collection') {
      // Revalidate collection pages
      if (handle) {
        revalidatePath(`/collections/${handle}`);
        console.log(`[Revalidation] Collection revalidated: /collections/${handle}`);
      }
      
      revalidateTag('collections');
      revalidatePath('/collections');
      console.log('[Revalidation] Collections tag revalidated');
      
    } else if (type === 'all') {
      // Nuclear option - revalidate everything
      revalidatePath('/', 'layout');
      console.log('[Revalidation] All pages revalidated');
      
    } else {
      // Legacy format support
      // Revalidate paths
      if (paths && Array.isArray(paths)) {
        for (const pathItem of paths) {
          revalidatePath(pathItem);
          console.log(`[Revalidation] Path revalidated: ${pathItem}`);
        }
      }

      // Revalidate tags
      if (tags && Array.isArray(tags)) {
        for (const tagItem of tags) {
          revalidateTag(tagItem);
          console.log(`[Revalidation] Tag revalidated: ${tagItem}`);
        }
      }

      // Single path
      if (path) {
        revalidatePath(path);
        console.log(`[Revalidation] Path revalidated: ${path}`);
      }

      // Single tag
      if (tag) {
        revalidateTag(tag);
        console.log(`[Revalidation] Tag revalidated: ${tag}`);
      }
    }

    return NextResponse.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString(),
      details: { type, paths, tags, handle, path, tag }
    });
    
  } catch (error) {
    console.error('[Revalidation] Error:', error);
    
    return NextResponse.json(
      { 
        error: "Revalidation failed",
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// GET endpoint for testing and documentation
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Revalidation endpoint is working',
    usage: {
      method: 'POST',
      headers: {
        'x-revalidate-token': 'your-token (env: REVALIDATE_TOKEN)',
        'x-revalidation-secret': 'your-secret (env: REVALIDATION_SECRET)',
        'Content-Type': 'application/json'
      },
      body: {
        // Option 1: Type-based revalidation
        type: 'product | collection | all',
        handle: 'product-or-collection-handle (optional)',
        
        // Option 2: Path/tag arrays (legacy)
        paths: ['array', 'of', 'paths'],
        tags: ['array', 'of', 'tags'],
        
        // Option 3: Single path/tag
        path: 'single-path-to-revalidate',
        tag: 'single-tag-to-revalidate'
      }
    },
    examples: [
      {
        description: 'Revalidate a specific product',
        body: { type: 'product', handle: 'navy-suit' }
      },
      {
        description: 'Revalidate all products',
        body: { type: 'product' }
      },
      {
        description: 'Revalidate multiple paths',
        body: { paths: ['/collections', '/products'] }
      },
      {
        description: 'Revalidate everything',
        body: { type: 'all' }
      }
    ]
  });
}