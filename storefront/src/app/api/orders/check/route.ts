import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route for checking order status by cart_id
 * This avoids CORS issues when calling the Medusa backend directly from the frontend
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cartId = searchParams.get('cart_id');

  if (!cartId) {
    return NextResponse.json(
      { success: false, error: 'cart_id parameter is required' },
      { status: 400 }
    );
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend-production-7441.up.railway.app";
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81";
    
    console.log(`[Order Check API] Checking order for cart_id: ${cartId}`);
    
    const response = await fetch(`${backendUrl}/store/orders/check?cart_id=${cartId}`, {
      method: 'GET',
      headers: {
        'x-publishable-api-key': publishableKey,
        'Content-Type': 'application/json',
        'User-Agent': 'KCT-Frontend/1.0',
      },
    });

    if (!response.ok) {
      console.log(`[Order Check API] Backend responded with status: ${response.status}`);
      
      if (response.status === 404) {
        // Order not found yet - this is expected while polling
        return NextResponse.json({
          success: false,
          order: null,
          message: 'Order not found yet'
        });
      }
      
      // Try to get error details from backend
      let errorMessage = 'Backend error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}`;
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[Order Check API] Backend response:`, data);
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('[Order Check API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check order status',
        details: 'Proxy request to backend failed'
      },
      { status: 500 }
    );
  }
}