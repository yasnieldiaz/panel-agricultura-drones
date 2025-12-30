import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, loading } = useAuth()

  // DEV MODE: Allow access with admin check for testing
  const devMode = import.meta.env.DEV

  if (loading && !devMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // In dev mode, allow access for testing
  if (devMode && !user) {
    return <>{children}</>
  }

  // If not logged in, redirect to auth
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // If logged in but not admin, redirect to client dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
