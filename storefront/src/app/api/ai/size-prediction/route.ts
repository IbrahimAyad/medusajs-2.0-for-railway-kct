import { NextRequest, NextResponse } from 'next/server'
import { AtelierAICore } from '@/lib/ai/atelier-ai-core'

// TEMPORARILY DISABLED - Supabase disabled during migration to Medusa

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, productId, measurements } = body

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      )
    }

    // Get AI instance
    const ai = AtelierAICore.getInstance()

    // Generate size recommendation
    const recommendation = await ai.predictSize(userId || 'guest', productId, measurements)

    return NextResponse.json({
      success: true,
      recommendation
    })
  } catch (error) {
    console.error('Size prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to predict size' },
      { status: 500 }
    )
  }
}