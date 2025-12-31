import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../lib/api'
import { isAdminEmail } from '../config/admin'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

type AuthMode = 'login' | 'signup'

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [forgotError, setForgotError] = useState<string | null>(null)
  const { t } = useLanguage()
  const { signIn, signUp, user, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }
  }, [user, isAdmin, navigate])

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    setForgotError(null)

    try {
      await authApi.forgotPassword(forgotEmail)
      setForgotSuccess(true)
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : t('forgotPassword.error'))
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgotPassword = () => {
    setShowForgotPassword(false)
    setForgotEmail('')
    setForgotSuccess(false)
    setForgotError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.passwordMismatch'))
          setIsLoading(false)
          return
        }

        const { error } = await signUp(formData.email, formData.password, {
          name: formData.name,
          phone: formData.phone
        })

        if (error) {
          setError(error.message)
        } else {
          // The useEffect will handle redirection based on user role
        }
      } else {
        const { error } = await signIn(formData.email, formData.password)

        if (error) {
          setError(error.message)
        } else {
          // Check if admin and redirect accordingly
          if (isAdminEmail(formData.email)) {
            navigate('/admin')
          } else {
            navigate('/dashboard')
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb-green w-96 h-96 -top-48 -right-48 floating" />
        <div className="orb-teal w-80 h-80 bottom-0 -left-40 floating-delayed" />
        <div className="orb-cyan w-64 h-64 top-1/2 right-1/4 floating" />
      </div>

      {/* Back Button & Language Selector */}
      <div className="fixed top-6 left-6 right-6 z-50 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('auth.back')}</span>
        </Link>
        <LanguageSelector />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative"
      >
        <div className="glass rounded-3xl p-8 relative overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5" />

          <div className="relative">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <Logo size="lg" />
            </div>

            {/* Mode Tabs */}
            <div className="flex mb-8 p-1 rounded-xl bg-white/5">
              {(['login', 'signup'] as AuthMode[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setMode(tab)
                    setError(null)
                  }}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all duration-150 ${
                    mode === tab
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab === 'login' ? t('auth.login') : t('auth.signup')}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-300"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="name"
                      placeholder={t('auth.name')}
                      value={formData.name}
                      onChange={handleChange}
                      className="input-glass pl-12"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder={t('auth.phone')}
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-glass pl-12"
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  name="email"
                  placeholder={t('auth.email')}
                  value={formData.email}
                  onChange={handleChange}
                  className="input-glass pl-12"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder={t('auth.password')}
                  value={formData.password}
                  onChange={handleChange}
                  className="input-glass pl-12 pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {mode === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder={t('auth.confirmPassword')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-glass pl-12"
                    required
                    minLength={6}
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mode === 'login' ? t('auth.loggingIn') : t('auth.signingUp')}
                  </>
                ) : (
                  mode === 'login' ? t('auth.loginButton') : t('auth.signupButton')
                )}
              </button>
            </form>

            {/* Terms */}
            {mode === 'signup' && (
              <p className="mt-6 text-center text-sm text-white/40">
                {t('auth.terms')}{' '}
                <a href="#" className="text-emerald-400 hover:underline">{t('auth.termsLink')}</a>
                {' '}{t('auth.and')}{' '}
                <a href="#" className="text-emerald-400 hover:underline">{t('auth.privacyLink')}</a>
              </p>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-30" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full blur-2xl opacity-20" />
      </motion.div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeForgotPassword} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md glass rounded-2xl p-6"
          >
            <button
              onClick={closeForgotPassword}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {t('forgotPassword.title')}
            </h3>

            {forgotSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-white/80 mb-4">{t('forgotPassword.success')}</p>
                <button onClick={closeForgotPassword} className="btn-primary">
                  {t('forgotPassword.close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-white/60 text-sm mb-4">
                  {t('forgotPassword.description')}
                </p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{forgotError}</span>
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    placeholder={t('auth.email')}
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input-glass pl-12"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('forgotPassword.sending')}
                    </>
                  ) : (
                    t('forgotPassword.sendButton')
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
