import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogOut,
  Loader2,
  Shield,
  Settings,
  Plus,
  Trash2,
  Key,
  Users,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Check,
  Mail,
  User,
  Calendar,
  RefreshCw,
  Send,
  ArrowLeft
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { usersApi, type AdminUser } from '../lib/api'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

export default function AdminClients() {
  const { t } = useLanguage()
  const { signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // State
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', role: 'user' as 'user' | 'admin' })
  const [createLoading, setCreateLoading] = useState(false)

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Password management
  const [passwordForm, setPasswordForm] = useState<{ userId: number; newPassword: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Reset email sending
  const [sendingResetId, setSendingResetId] = useState<number | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await usersApi.getAll()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Handle logout
  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await usersApi.create(createForm.email, createForm.password, createForm.name || undefined, createForm.role)
      setSuccess(createForm.role === 'admin' ? t('admin.clients.adminCreated') : t('admin.clients.clientCreated'))
      setShowCreateModal(false)
      setCreateForm({ email: '', password: '', name: '', role: 'user' })
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    } finally {
      setCreateLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    setDeletingId(userId)
    setError(null)
    setSuccess(null)

    try {
      await usersApi.delete(userId)
      setSuccess(t('admin.clients.clientDeleted'))
      setConfirmDelete(null)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    } finally {
      setDeletingId(null)
    }
  }

  // Change user password
  const handleChangePassword = async (userId: number, newPassword: string) => {
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setPasswordLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await usersApi.changeUserPassword(userId, newPassword)
      setSuccess(t('admin.clients.passwordUpdated'))
      setPasswordForm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Send password reset email
  const handleSendResetEmail = async (userId: number) => {
    setSendingResetId(userId)
    setError(null)
    setSuccess(null)

    try {
      await usersApi.sendPasswordReset(userId)
      setSuccess(t('admin.clients.resetEmailSent'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar email')
    } finally {
      setSendingResetId(null)
    }
  }

  // Filter only clients (non-admin users)
  const clients = users.filter(u => u.role !== 'admin')
  const admins = users.filter(u => u.role === 'admin')

  if (authLoading) {
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
        {/* Back button and Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.clients.backToPanel')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Users className="w-8 h-8 text-emerald-400" />
                {t('admin.clients.title')}
              </h1>
              <p className="text-white/60">{t('admin.clients.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                className="btn-glass flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('admin.clients.newUser')}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="card-glass">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {clients.length}
            </div>
            <div className="text-white/60 text-sm mt-1">{t('admin.clients.clients')}</div>
          </div>
          <div className="card-glass">
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {admins.length}
            </div>
            <div className="text-white/60 text-sm mt-1">{t('admin.clients.admins')}</div>
          </div>
          <div className="card-glass">
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {users.length}
            </div>
            <div className="text-white/60 text-sm mt-1">{t('admin.clients.totalUsers')}</div>
          </div>
        </motion.div>

        {/* Clients List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-blue-400" />
              {t('admin.clients.registeredClients')}
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12 text-white/40">
                {t('admin.clients.noClients')}
              </div>
            ) : (
              <div className="space-y-3">
                {clients.map((client, index) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-white">{client.name || t('admin.clients.noName')}</div>
                            <div className="text-sm text-white/60 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-white/40">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(client.created_at).toLocaleDateString()}
                          </div>
                          <div className="px-2 py-0.5 bg-white/10 rounded text-xs">
                            {client.language?.toUpperCase() || 'ES'}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {/* Password change form */}
                        {passwordForm?.userId === client.id ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="input-glass text-sm py-2 px-3 w-40 pr-8"
                                minLength={6}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                              >
                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                            <button
                              onClick={() => handleChangePassword(client.id, passwordForm.newPassword)}
                              disabled={passwordLoading}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            >
                              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setPasswordForm(null)}
                              className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Change Password */}
                            <button
                              onClick={() => setPasswordForm({ userId: client.id, newPassword: '' })}
                              className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs flex items-center gap-1.5"
                              title="Cambiar contraseña"
                            >
                              <Key className="w-3 h-3" />
                              <span className="hidden sm:inline">{t('admin.clients.password')}</span>
                            </button>

                            {/* Send Reset Email */}
                            <button
                              onClick={() => handleSendResetEmail(client.id)}
                              disabled={sendingResetId === client.id}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs flex items-center gap-1.5 disabled:opacity-50"
                              title="Enviar email de recuperación"
                            >
                              {sendingResetId === client.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span className="hidden sm:inline">Reset Email</span>
                            </button>

                            {/* Delete */}
                            {confirmDelete === client.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteUser(client.id)}
                                  disabled={deletingId === client.id}
                                  className="px-3 py-1.5 rounded-lg bg-red-500/30 text-red-400 hover:bg-red-500/40 text-xs flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {deletingId === client.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  {t('admin.clients.confirm')}
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 text-xs"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(client.id)}
                                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs flex items-center gap-1.5"
                                title="Eliminar cliente"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="hidden sm:inline">{t('admin.clients.delete')}</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Admins Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="glass rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-amber-400" />
              {t('admin.clients.admins')}
            </h2>

            {admins.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                {t('admin.clients.noAdmins')}
              </div>
            ) : (
              <div className="space-y-3">
                {admins.map((admin, index) => (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-dark rounded-xl p-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {admin.name || admin.email}
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                              Admin
                            </span>
                          </div>
                          <div className="text-sm text-white/60">{admin.email}</div>
                        </div>
                      </div>

                      {/* Admin password change */}
                      <div className="flex flex-wrap gap-2">
                        {passwordForm?.userId === admin.id ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="input-glass text-sm py-2 px-3 w-40 pr-8"
                                minLength={6}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                              >
                                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                            <button
                              onClick={() => handleChangePassword(admin.id, passwordForm.newPassword)}
                              disabled={passwordLoading}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            >
                              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setPasswordForm(null)}
                              className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setPasswordForm({ userId: admin.id, newPassword: '' })}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs flex items-center gap-1.5"
                            >
                              <Key className="w-3 h-3" />
                              {t('admin.clients.changePassword')}
                            </button>
                            <button
                              onClick={() => handleSendResetEmail(admin.id)}
                              disabled={sendingResetId === admin.id}
                              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {sendingResetId === admin.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Reset Email
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 w-full max-w-md relative z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                {t('admin.clients.newUser')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm text-white/60 mb-2">{t('admin.clients.userType')} *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'user' })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 justify-center ${
                      createForm.role === 'user'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {t('admin.clients.client')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, role: 'admin' })}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 justify-center ${
                      createForm.role === 'admin'
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                        : 'border-white/10 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    {t('admin.clients.administrator')}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">{t('admin.clients.name')}</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="input-glass"
                  placeholder={t('admin.clients.namePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">{t('admin.clients.email')} *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="input-glass"
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-1">{t('admin.clients.password')} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="input-glass pr-10"
                    placeholder={t('admin.clients.passwordPlaceholder')}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-glass flex-1"
                >
                  {t('admin.clients.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    createForm.role === 'admin'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {createLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : createForm.role === 'admin' ? (
                    <Shield className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {createForm.role === 'admin' ? t('admin.clients.createAdmin') : t('admin.clients.createClient')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
