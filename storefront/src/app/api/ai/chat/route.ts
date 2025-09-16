import { NextRequest, NextResponse } from 'next/server'
import { ConversationalAI } from '@/lib/ai/services/conversational-ai'
import type { ConversationContext, Message } from '@/lib/ai/types'

// TEMPORARILY DISABLED - Supabase disabled during migration to Medusa

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, userId, context } = await request.json()

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and session ID are required' },
        { status: 400 }
      )
    }

    // Initialize AI service
    const conversationalAI = new ConversationalAI()

    // Get conversation history from database or session
    // Disabled during migration - using empty history
    const history: any[] = []

    // Build conversation context
    const conversationHistory: Message[] = history.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date(msg.created_at)
    })) || []

    const conversationContext: ConversationContext = {
      sessionId,
      userId,
      history: conversationHistory,
      ...context
    }

    // Process message with AI
    const response = await conversationalAI.processMessage(message, conversationContext)

    // Store messages in history - disabled during migration
    /* 
    await supabase.from('chat_history').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'user',
      content: message,
      intent: response.intent,
      confidence: response.confidence
    })

    await supabase.from('chat_history').insert({
      session_id: sessionId,
      user_id: userId,
      role: 'assistant',
      content: response.message,
      intent: response.intent,
      product_recommendations: response.productRecommendations?.map(p => p.productId)
    })
    */

    // If we have product recommendations, fetch full product details
    let enrichedRecommendations = []
    if (response.productRecommendations && response.productRecommendations.length > 0) {
      // Disabled during migration - return recommendations as-is
      enrichedRecommendations = response.productRecommendations
      /*
      const productIds = response.productRecommendations.map(p => p.productId)
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
      
      enrichedRecommendations = response.productRecommendations.map(rec => {
        const product = products?.find(p => p.id === rec.productId)
        return {
          ...rec,
          product
        }
      })
      */
    }

    // Return response
    const result = {
      ...response,
      productRecommendations: enrichedRecommendations
    }

    // Track AI interaction - disabled during migration
    /*
    await supabase.from('ai_interactions').insert({
      user_id: userId,
      session_id: sessionId,
      interaction_type: 'chat',
      request_data: JSON.stringify({ message, context }),
      response_data: JSON.stringify(result)
    })
    */

    return NextResponse.json(result)

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID is required' },
      { status: 400 }
    )
  }

  // Get conversation history - disabled during migration
  const history: any[] = []
  /*
  const { data: history, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
  */

  return NextResponse.json({ history })
}