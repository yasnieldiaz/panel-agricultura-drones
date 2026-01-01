import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Shield, X, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

const COOKIE_CONSENT_KEY = 'cookie_consent'
const COOKIE_PREFERENCES_KEY = 'cookie_preferences'

interface CookiePreferences {
  necessary: boolean // Always true, cannot be disabled
  analytics: boolean
  marketing: boolean
}

export default function CookieConsent() {
  const { t } = useLanguage()
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay to avoid showing immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 1000)
      return () => clearTimeout(timer)
    } else {
      // Load saved preferences
      const saved = localStorage.getItem(COOKIE_PREFERENCES_KEY)
      if (saved) {
        try {
          setPreferences(JSON.parse(saved))
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true
    }
    saveConsent(allAccepted)
  }

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false
    }
    saveConsent(necessaryOnly)
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
  }

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, new Date().toISOString())
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setPreferences(prefs)
    setShowBanner(false)
    setShowSettings(false)
  }

  if (!showBanner) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4"
      >
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-6 shadow-xl border border-white/20">
            {!showSettings ? (
              // Main Banner
              <>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      {t('cookies.title')}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed">
                      {t('cookies.description')}{' '}
                      <Link to="/privacy" className="text-emerald-400 hover:underline">
                        {t('cookies.privacyLink')}
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button
                    onClick={handleAcceptAll}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {t('cookies.acceptAll')}
                  </button>
                  <button
                    onClick={handleAcceptNecessary}
                    className="btn-glass flex items-center justify-center gap-2"
                  >
                    {t('cookies.acceptNecessary')}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="btn-glass flex items-center justify-center gap-2 text-white/70"
                  >
                    {t('cookies.customize')}
                  </button>
                </div>
              </>
            ) : (
              // Settings Panel
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-emerald-400" />
                    {t('cookies.settingsTitle')}
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Necessary Cookies */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="text-white font-medium">{t('cookies.necessary')}</p>
                      <p className="text-white/50 text-sm">{t('cookies.necessaryDesc')}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                      {t('cookies.required')}
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="text-white font-medium">{t('cookies.analytics')}</p>
                      <p className="text-white/50 text-sm">{t('cookies.analyticsDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Marketing Cookies */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="text-white font-medium">{t('cookies.marketing')}</p>
                      <p className="text-white/50 text-sm">{t('cookies.marketingDesc')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleSavePreferences}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {t('cookies.savePreferences')}
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="btn-glass flex items-center justify-center gap-2"
                  >
                    {t('cookies.acceptAll')}
                  </button>
                </div>
              </>
            )}

            {/* GDPR Badge */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/40">
              <Shield className="w-4 h-4" />
              <span>{t('cookies.gdprCompliant')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
