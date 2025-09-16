// TEMPORARILY DISABLED - Supabase auth disabled during migration to Medusa
// TODO: Replace with Medusa customer authentication

import { useEffect } from 'react'
import { useCustomerStore } from '@/store/customerStore'
import type { CustomerProfile, LoyaltyTier } from '@/lib/customer/types'

export function useAuth() {
  const { login, logout, profile, isAuthenticated } = useCustomerStore()

  useEffect(() => {
    // Auth functionality disabled during migration
    // TODO: Implement Medusa customer session check
  }, [])

  const signIn = async (email: string, password: string) => {
    // Temporarily disabled during migration
    console.log('Auth disabled during migration')
    return { error: 'Authentication temporarily disabled' }
  }

  const signUp = async (email: string, password: string, profile?: Partial<CustomerProfile>) => {
    // Temporarily disabled during migration
    console.log('Auth disabled during migration')
    return { error: 'Authentication temporarily disabled' }
  }

  const signOut = async () => {
    logout()
  }

  return {
    isAuthenticated,
    profile,
    signIn,
    signUp,
    signOut,
  }
}