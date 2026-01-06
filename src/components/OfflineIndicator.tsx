import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useLanguage } from '../contexts/LanguageContext'

export default function OfflineIndicator() {
  const { isOnline, wasOffline, resetWasOffline } = useNetworkStatus()
  const { t } = useLanguage()
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true)
      const timer = setTimeout(() => {
        setShowReconnected(false)
        resetWasOffline()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, wasOffline, resetWasOffline])

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-amber-500/90 backdrop-blur-sm text-white px-4 py-3 flex items-center justify-center gap-3"
        >
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">{t('offline.noConnection')}</span>
          <span className="text-amber-100 text-sm">{t('offline.usingCache')}</span>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-emerald-500/90 backdrop-blur-sm text-white px-4 py-3 flex items-center justify-center gap-3"
        >
          <Wifi className="w-5 h-5" />
          <span className="font-medium">{t('offline.reconnected')}</span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t('offline.refresh')}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
