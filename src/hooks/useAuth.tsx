import { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react'
import { api, type User } from '../lib/api'
import { isAdminEmail } from '../config/admin'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  token: string | null
  signUp: (email: string, password: string, metadata?: { name?: string; phone?: string; language?: string }) => Promise<{ error: Error | null }>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser()
        setUser(currentUser)
        setToken(localStorage.getItem('auth_token'))
      } catch {
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const signUp = async (email: string, password: string, metadata?: { name?: string; phone?: string; language?: string }) => {
    try {
      const { user: newUser } = await api.register(email, password, {
        name: metadata?.name,
        phone: metadata?.phone,
        language: metadata?.language
      })
      setUser(newUser)
      setToken(localStorage.getItem('auth_token'))
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { user: loggedUser } = await api.login(email, password)
      setUser(loggedUser)
      setToken(localStorage.getItem('auth_token'))
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    await api.logout()
    setUser(null)
    setToken(null)
  }

  const isAdmin = useMemo(() => {
    return isAdminEmail(user?.email)
  }, [user?.email])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, token, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
