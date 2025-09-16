'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface MedusaUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

interface MedusaAuthContextType {
  user: MedusaUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  error: string | null
}

interface RegisterData {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

const MedusaAuthContext = createContext<MedusaAuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://backend-production-7441.up.railway.app'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_PUBLISHABLE_KEY || 'pk_4c24b336db3f8819867bec16f4b51db9654e557abbcfbbe003f7ffd8463c3c81'

export function MedusaAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MedusaUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('medusa_token')
    const email = localStorage.getItem('medusa_email')
    
    if (token && email) {
      // Set basic user info from localStorage
      setUser({
        id: 'customer',
        email: email
      })
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/customer/emailpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Invalid credentials')
      }

      const { token } = await response.json()
      
      // Store authentication
      localStorage.setItem('medusa_token', token)
      localStorage.setItem('medusa_email', email)
      
      // Set user
      setUser({
        id: 'customer',
        email: email
      })
      
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/auth/customer/emailpass/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Registration failed')
      }

      const { token } = await response.json()
      
      // Store authentication
      localStorage.setItem('medusa_token', token)
      localStorage.setItem('medusa_email', data.email)
      
      // Set user
      setUser({
        id: 'customer',
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name
      })
      
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('medusa_token')
    localStorage.removeItem('medusa_email')
    localStorage.removeItem('medusa_cart_id')
    setUser(null)
    setError(null)
  }

  return (
    <MedusaAuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        error
      }}
    >
      {children}
    </MedusaAuthContext.Provider>
  )
}

export function useMedusaAuth() {
  const context = useContext(MedusaAuthContext)
  if (!context) {
    throw new Error('useMedusaAuth must be used within MedusaAuthProvider')
  }
  return context
}