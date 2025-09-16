import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get both potential sources of the key
  const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const expectedKey = 'pk_live_51RAMT2CHc12x7sCzz0cBxUwBPONdyvxMnhDRMwC1bgoaFlDgmEmfvcJZT7yk7jOuEo4LpWkFpb5Gv88DJ9fSB49j00QtRac8uW'
  
  // Check if they match
  const keysMatch = envKey === expectedKey
  
  // Get key being used in the app
  const actualKeyInUse = envKey || expectedKey
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: {
      hasEnvKey: !!envKey,
      envKeyPrefix: envKey ? envKey.substring(0, 30) + '...' : 'NOT SET',
      envKeyLength: envKey ? envKey.length : 0,
    },
    expected: {
      keyPrefix: expectedKey.substring(0, 30) + '...',
      keyLength: expectedKey.length,
    },
    comparison: {
      keysMatch,
      issue: !keysMatch ? 
        (envKey ? 
          'Environment variable is set but differs from expected key' : 
          'Environment variable not set, using hardcoded default'
        ) : 
        'Keys match correctly'
    },
    actualInUse: {
      prefix: actualKeyInUse.substring(0, 30) + '...',
      full: actualKeyInUse,
      isCorrect: actualKeyInUse === expectedKey
    },
    fix: !keysMatch ? 
      'Update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in Railway to: ' + expectedKey :
      'No action needed - correct key is being used'
  })
}