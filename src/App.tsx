import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import CookieConsent from './components/CookieConsent'
import OfflineIndicator from './components/OfflineIndicator'

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))
const AdminClients = lazy(() => import('./pages/AdminClients'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Help = lazy(() => import('./pages/Help'))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <span className="text-white/60 text-sm">Loading...</span>
    </div>
  </div>
)

function App() {
  return (
    <>
    <OfflineIndicator />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<Help />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettings />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/clients"
          element={
            <AdminRoute>
              <AdminClients />
            </AdminRoute>
          }
        />
      </Routes>
    </Suspense>
    <CookieConsent />
    </>
  )
}

export default App
