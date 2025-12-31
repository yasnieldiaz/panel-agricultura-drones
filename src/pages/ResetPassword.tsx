import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { authApi } from '../lib/api'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!token) {
      navigate('/auth')
    }
  }, [token, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      setIsLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError(t('resetPassword.minLength'))
      setIsLoading(false)
      return
    }

    try {
      await authApi.resetPassword(token!, formData.newPassword)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('resetPassword.error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) return null

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
          to="/auth"
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('auth.back')}</span>
        </Link>
        <LanguageSelector />
      </div>

      {/* Reset Password Card */}
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

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              {t('resetPassword.title')}
            </h2>

            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-white/80 mb-6">{t('resetPassword.success')}</p>
                <Link to="/auth" className="btn-primary inline-block">
                  {t('resetPassword.goToLogin')}
                </Link>
              </div>
            ) : (
              <>
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
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="newPassword"
                      placeholder={t('resetPassword.newPassword')}
                      value={formData.newPassword}
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

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder={t('resetPassword.confirmPassword')}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-glass pl-12"
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('resetPassword.resetting')}
                      </>
                    ) : (
                      t('resetPassword.resetButton')
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-30" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full blur-2xl opacity-20" />
      </motion.div>
    </div>
  )
}
