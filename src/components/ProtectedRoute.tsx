import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // DEV MODE: Allow access without auth for testing
  const devMode = import.meta.env.DEV

  if (loading && !devMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (!user && !devMode) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}
