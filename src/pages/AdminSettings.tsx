import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LogOut,
  Settings,
  MessageSquare,
  Mail,
  Key,
  Server,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield,
  RefreshCw,
  Phone,
  Send
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

interface VonageConfig {
  apiKey: string
  apiSecret: string
  fromNumber: string
}

interface SmtpConfig {
  host: string
  port: string
  user: string
  pass: string
  fromEmail: string
}

interface ConfigStatus {
  vonage: boolean
  smtp: boolean
}

const API_URL = import.meta.env.VITE_API_URL || '/api'

export default function AdminSettings() {
  const { t } = useLanguage()
  const { signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [vonageConfig, setVonageConfig] = useState<VonageConfig>({
    apiKey: '',
    apiSecret: '',
    fromNumber: 'Drone Service'
  })

  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: 'smtp.gmail.com',
    port: '587',
    user: '',
    pass: '',
    fromEmail: ''
  })

  const [showSecrets, setShowSecrets] = useState({
    vonageSecret: false,
    smtpPass: false
  })

  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<'vonage' | 'smtp' | 'sms' | null>(null)
  const [status, setStatus] = useState<ConfigStatus>({ vonage: false, smtp: false })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testPhone, setTestPhone] = useState('')

  // Load current configuration
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/config`)
      if (response.ok) {
        const data = await response.json()
        if (data.vonage) {
          setVonageConfig(prev => ({
            ...prev,
            apiKey: data.vonage.apiKey || '',
            fromNumber: data.vonage.fromNumber || 'Drone Service'
          }))
        }
        if (data.smtp) {
          setSmtpConfig(prev => ({
            ...prev,
            host: data.smtp.host || 'smtp.gmail.com',
            port: data.smtp.port || '587',
            user: data.smtp.user || '',
            fromEmail: data.smtp.fromEmail || ''
          }))
        }
        setStatus(data.status || { vonage: false, smtp: false })
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const saveVonageConfig = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/config/vonage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vonageConfig)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: t('settings.vonageSaved') })
        setStatus(prev => ({ ...prev, vonage: true }))
      } else {
        setMessage({ type: 'error', text: data.error || t('settings.saveError') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.saveError') })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const saveSmtpConfig = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/config/smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: t('settings.smtpSaved') })
        setStatus(prev => ({ ...prev, smtp: true }))
      } else {
        setMessage({ type: 'error', text: data.error || t('settings.saveError') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.saveError') })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const testVonage = async () => {
    setTesting('vonage')
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/config/test-vonage`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.vonageTestSuccess') })
      } else {
        setMessage({ type: 'error', text: data.error || t('settings.vonageTestError') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.vonageTestError') })
    } finally {
      setTesting(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const testSmtp = async () => {
    setTesting('smtp')
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/config/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: smtpConfig.user })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.smtpTestSuccess') })
      } else {
        setMessage({ type: 'error', text: data.error || t('settings.smtpTestError') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.smtpTestError') })
    } finally {
      setTesting(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const sendTestSms = async () => {
    if (!testPhone.trim()) {
      setMessage({ type: 'error', text: t('settings.enterTestPhone') })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setTesting('sms')
    setMessage(null)

    try {
      const response = await fetch(`${API_URL}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhone,
          message: `🚁 Drone Service - Test SMS\n\nThis is a test message from your Drone Service panel. If you received this, your SMS configuration is working correctly!`
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: t('settings.smsTestSuccess') })
      } else {
        setMessage({ type: 'error', text: data.error || t('settings.smsTestError') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('settings.smsTestError') })
    } finally {
      setTesting(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

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
              <Logo size="md" />
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <LanguageSelector />
              <button
                onClick={handleLogout}
                className="btn-glass flex items-center gap-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Back Link */}
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('settings.backToAdmin')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-emerald-400" />
            {t('settings.title')}
          </h1>
          <p className="text-white/60">{t('settings.subtitle')}</p>
        </motion.div>

        {/* Status Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* Vonage SMS Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{t('settings.vonageTitle')}</h2>
                <p className="text-white/60 text-sm">{t('settings.vonageSubtitle')}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              status.vonage
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {status.vonage ? t('settings.configured') : t('settings.notConfigured')}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Key
              </label>
              <input
                type="text"
                value={vonageConfig.apiKey}
                onChange={(e) => setVonageConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="xxxxxxxx"
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Secret
              </label>
              <div className="relative">
                <input
                  type={showSecrets.vonageSecret ? 'text' : 'password'}
                  value={vonageConfig.apiSecret}
                  onChange={(e) => setVonageConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                  placeholder="••••••••••••"
                  className="input-glass w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, vonageSecret: !prev.vonageSecret }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showSecrets.vonageSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                {t('settings.fromNumber')}
              </label>
              <input
                type="text"
                value={vonageConfig.fromNumber}
                onChange={(e) => setVonageConfig(prev => ({ ...prev, fromNumber: e.target.value }))}
                placeholder="Drone Service"
                className="input-glass w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveVonageConfig}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('settings.save')}
              </button>
              <button
                onClick={testVonage}
                disabled={testing === 'vonage' || !status.vonage}
                className="btn-glass flex items-center gap-2"
              >
                {testing === 'vonage' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('settings.test')}
              </button>
            </div>

            {/* Test SMS Section */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                {t('settings.testSms')}
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {t('settings.testPhone')}
                  </label>
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+48 123 456 789"
                    className="input-glass w-full"
                  />
                  <p className="text-white/40 text-xs mt-1">{t('settings.testPhoneHint')}</p>
                </div>
                <div className="flex items-end pb-6">
                  <button
                    onClick={sendTestSms}
                    disabled={testing === 'sms' || !testPhone.trim() || !status.vonage}
                    className="btn-primary flex items-center gap-2 whitespace-nowrap"
                  >
                    {testing === 'sms' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {t('settings.sendTestSms')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SMTP Email Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{t('settings.smtpTitle')}</h2>
                <p className="text-white/60 text-sm">{t('settings.smtpSubtitle')}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              status.smtp
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {status.smtp ? t('settings.configured') : t('settings.notConfigured')}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  {t('settings.smtpHost')}
                </label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                  className="input-glass w-full"
                />
              </div>
              <div>
                <label className="block text-white/60 text-sm mb-1">
                  {t('settings.smtpPort')}
                </label>
                <input
                  type="text"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: e.target.value }))}
                  placeholder="587"
                  className="input-glass w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('settings.smtpUser')}
              </label>
              <input
                type="email"
                value={smtpConfig.user}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                placeholder="tu-email@gmail.com"
                className="input-glass w-full"
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                <Key className="w-4 h-4" />
                {t('settings.smtpPass')}
              </label>
              <div className="relative">
                <input
                  type={showSecrets.smtpPass ? 'text' : 'password'}
                  value={smtpConfig.pass}
                  onChange={(e) => setSmtpConfig(prev => ({ ...prev, pass: e.target.value }))}
                  placeholder="••••••••••••"
                  className="input-glass w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowSecrets(prev => ({ ...prev, smtpPass: !prev.smtpPass }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showSecrets.smtpPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-white/40 text-xs mt-1">{t('settings.smtpPassHint')}</p>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('settings.fromEmail')}
              </label>
              <input
                type="email"
                value={smtpConfig.fromEmail}
                onChange={(e) => setSmtpConfig(prev => ({ ...prev, fromEmail: e.target.value }))}
                placeholder="noreply@dronegarden.com"
                className="input-glass w-full"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveSmtpConfig}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t('settings.save')}
              </button>
              <button
                onClick={testSmtp}
                disabled={testing === 'smtp' || !status.smtp}
                className="btn-glass flex items-center gap-2"
              >
                {testing === 'smtp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t('settings.test')}
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
