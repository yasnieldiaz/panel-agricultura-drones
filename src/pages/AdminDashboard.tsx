import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogOut,
  Calendar as CalendarIcon,
  List,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  User,
  Phone,
  Mail,
  Check,
  X,
  Shield,
  Settings,
  Plus,
  Trash2,
  Play,
  XCircle,
  RefreshCw,
  Key,
  Users,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { authApi, usersApi, type AdminUser } from '../lib/api'
import LanguageSelector from '../components/LanguageSelector'
import ServiceRequestModal from '../components/ServiceRequestModal'
import Logo from '../components/Logo'

const API_URL = import.meta.env.VITE_API_URL || 'https://cieniowanie.droneagri.pl/api'

// Types
interface ServiceRequest {
  id: number
  user_id: number
  service: string
  scheduled_date: string
  scheduled_time: string
  name: string
  email: string
  phone: string
  location: string
  area: number | null
  notes: string | null
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

// Service name mapping
const SERVICE_KEYS: Record<string, string> = {
  'fumigation': 'service.fumigation.title',
  'mapping': 'service.mapping.title',
  'painting': 'service.painting.title',
  'rental': 'service.rental.title'
}

type TabType = 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed'

export default function AdminDashboard() {
  const { t } = useLanguage()
  const { signOut, loading: authLoading, token } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  // Password management state
  const [users, setUsers] = useState<AdminUser[]>([])
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [userPasswordForm, setUserPasswordForm] = useState<{userId: number; newPassword: string} | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Fetch service requests from API
  const fetchRequests = async () => {
    if (!token) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/admin/service-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar solicitudes')
      }

      const data = await response.json()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [token])

  // Fetch users for password management
  const fetchUsers = async () => {
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  useEffect(() => {
    if (showPasswordSection) {
      fetchUsers()
    }
  }, [showPasswordSection])

  // Change own password
  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('auth.passwordMismatch'))
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('resetPassword.minLength'))
      return
    }

    setPasswordLoading(true)
    try {
      await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordSuccess(t('admin.passwordChanged'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('admin.passwordError'))
    } finally {
      setPasswordLoading(false)
    }
  }

  // Change user password (admin)
  const handleChangeUserPassword = async (userId: number, newPassword: string) => {
    if (newPassword.length < 6) {
      setPasswordError(t('resetPassword.minLength'))
      return
    }

    setPasswordLoading(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    try {
      await usersApi.changeUserPassword(userId, newPassword)
      setPasswordSuccess(t('admin.userPasswordChanged'))
      setUserPasswordForm(null)
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('admin.passwordError'))
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Update status via API
  const updateStatus = async (id: number, newStatus: ServiceRequest['status']) => {
    if (!token) return

    setUpdatingId(id)

    try {
      const response = await fetch(`${API_URL}/admin/service-requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      // Update local state
      setRequests(prev => prev.map(req =>
        req.id === id ? { ...req, status: newStatus } : req
      ))
    } catch (err) {
      console.error('Error updating status:', err)
      alert(t('admin.statusError'))
    } finally {
      setUpdatingId(null)
    }
  }

  // Delete request via API
  const deleteRequest = async (id: number) => {
    if (!token) return

    setDeletingId(id)

    try {
      const response = await fetch(`${API_URL}/admin/service-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar solicitud')
      }

      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== id))
      setConfirmDelete(null)
    } catch (err) {
      console.error('Error deleting request:', err)
      alert(t('admin.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  // Filter requests by tab
  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests
    return requests.filter(req => req.status === activeTab)
  }, [activeTab, requests])

  // Get status color
  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'in_progress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-white/20 text-white/60 border-white/30'
    }
  }

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'confirmed': return <Clock className="w-4 h-4" />
      case 'pending': return <Circle className="w-4 h-4" />
      case 'in_progress': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const getServiceKey = (service: string) => {
    return SERVICE_KEYS[service] || service
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb-green w-96 h-96 -top-48 -left-48 floating" />
        <div className="orb-teal w-80 h-80 top-1/4 right-0 floating-delayed" />
        <div className="orb-cyan w-64 h-64 bottom-0 left-1/4 floating" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" showText={false} />
              <span className="hidden sm:inline text-xl font-bold gradient-text">Drone Service</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <LanguageSelector />
              <Link
                to="/admin/settings"
                className="btn-glass flex items-center gap-2 text-sm px-2 sm:px-4"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t('settings.title')}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="btn-glass flex items-center gap-2 text-sm px-2 sm:px-4"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                {t('admin.title')}
              </h1>
              <p className="text-white/60">{t('admin.subtitle')}</p>
            </div>
            <button
              onClick={fetchRequests}
              className="btn-glass flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t('admin.refresh')}</span>
            </button>
          </div>
        </motion.div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          {[
            { label: t('dashboard.pending'), value: requests.filter(r => r.status === 'pending').length, color: 'from-amber-500 to-orange-500' },
            { label: t('dashboard.confirmed'), value: requests.filter(r => r.status === 'confirmed').length, color: 'from-blue-500 to-cyan-500' },
            { label: t('dashboard.inProgress'), value: requests.filter(r => r.status === 'in_progress').length, color: 'from-purple-500 to-pink-500' },
            { label: t('dashboard.completed'), value: requests.filter(r => r.status === 'completed').length, color: 'from-emerald-500 to-teal-500' },
            { label: t('dashboard.all'), value: requests.length, color: 'from-gray-500 to-gray-600' },
          ].map((stat, index) => (
            <div key={index} className="card-glass">
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-400" />
                {t('admin.requests')}
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(['all', 'pending', 'confirmed', 'in_progress', 'completed'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t(`dashboard.${tab === 'in_progress' ? 'inProgress' : tab}`)}
                </button>
              ))}
            </div>

            {/* Requests Table */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  {t('admin.noRequests')}
                </div>
              ) : (
                filteredRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-white">{t(getServiceKey(request.service))}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {t(`dashboard.status.${request.status}`)}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-sm text-white/60 mb-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {request.name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            {request.email}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            {request.phone}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(request.scheduled_date).toLocaleDateString()} - {request.scheduled_time}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {request.location}
                          </div>
                          {request.area && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-emerald-400">{request.area}</span>
                              {t('dashboard.hectares')}
                            </div>
                          )}
                        </div>

                        {request.notes && (
                          <div className="mt-2 text-sm text-white/40 italic">
                            "{request.notes}"
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {/* Status change buttons */}
                        <div className="flex flex-wrap gap-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => updateStatus(request.id, 'confirmed')}
                              disabled={updatingId === request.id}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              {t('admin.confirm')}
                            </button>
                          )}

                          {request.status === 'confirmed' && (
                            <button
                              onClick={() => updateStatus(request.id, 'in_progress')}
                              disabled={updatingId === request.id}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                              {t('admin.startWork')}
                            </button>
                          )}

                          {(request.status === 'confirmed' || request.status === 'in_progress') && (
                            <button
                              onClick={() => updateStatus(request.id, 'completed')}
                              disabled={updatingId === request.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {t('admin.complete')}
                            </button>
                          )}

                          {request.status !== 'cancelled' && request.status !== 'completed' && (
                            <button
                              onClick={() => updateStatus(request.id, 'cancelled')}
                              disabled={updatingId === request.id}
                              className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              {t('admin.cancel')}
                            </button>
                          )}

                          {/* Delete button */}
                          {confirmDelete === request.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteRequest(request.id)}
                                disabled={deletingId === request.id}
                                className="px-3 py-1.5 rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/40 transition-colors text-xs flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {deletingId === request.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                                {t('admin.confirmDelete')}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(request.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              {t('admin.delete')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Password Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="glass rounded-2xl p-6">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                {t('admin.passwordManagement')}
              </h2>
              <span className={`text-white/60 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showPasswordSection && (
              <div className="mt-6 space-y-6">
                {/* Messages */}
                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{passwordError}</span>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-2 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{passwordSuccess}</span>
                  </div>
                )}

                {/* Change Own Password */}
                <div className="glass-dark rounded-xl p-4">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    {t('admin.changeOwnPassword')}
                  </h3>
                  <form onSubmit={handleChangeOwnPassword} className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('admin.currentPassword')}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="input-glass pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('admin.newPassword')}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="input-glass"
                      required
                      minLength={6}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('admin.confirmNewPassword')}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input-glass"
                      required
                      minLength={6}
                    />
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      {t('admin.changePassword')}
                    </button>
                  </form>
                </div>

                {/* Users List */}
                <div className="glass-dark rounded-xl p-4">
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    {t('admin.userAccounts')}
                  </h3>
                  <div className="space-y-3">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{user.email}</span>
                            {user.role === 'admin' && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            )}
                          </div>
                          {user.name && <div className="text-sm text-white/60">{user.name}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          {userPasswordForm?.userId === user.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('admin.newPassword')}
                                value={userPasswordForm.newPassword}
                                onChange={(e) => setUserPasswordForm({ ...userPasswordForm, newPassword: e.target.value })}
                                className="input-glass text-sm py-2 px-3 w-40"
                                minLength={6}
                              />
                              <button
                                onClick={() => handleChangeUserPassword(user.id, userPasswordForm.newPassword)}
                                disabled={passwordLoading}
                                className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              >
                                {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setUserPasswordForm(null)}
                                className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setUserPasswordForm({ userId: user.id, newPassword: '' })}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs flex items-center gap-1.5"
                            >
                              <Key className="w-3 h-3" />
                              {t('admin.changePassword')}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="text-center py-4 text-white/40">
                        {t('admin.noUsers')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Floating Request Service Button */}
      <button
        onClick={() => setServiceModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/30"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">{t('serviceRequest.floatingButton')}</span>
      </button>

      {/* Service Request Modal */}
      <ServiceRequestModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
      />
    </div>
  )
}
