import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronLeft,
  HelpCircle,
  UserPlus,
  LogIn,
  LayoutDashboard,
  FileText,
  Plane,
  Leaf,
  MapPin,
  Mountain,
  Truck,
  Wrench,
  Clock,
  WifiOff,
  MessageCircleQuestion
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

interface HelpSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function HelpSection({ title, icon, children, defaultOpen = false }: HelpSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="glass rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            {icon}
          </div>
          <span className="text-white font-semibold text-lg">{title}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-white/70 space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Help() {
  const { t } = useLanguage()

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link to="/" className="btn-glass flex items-center gap-2 text-sm">
                <ChevronLeft className="w-4 h-4" />
                {t('help.back')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {t('help.title')}
          </h1>
          <p className="text-white/60">{t('help.subtitle')}</p>
        </motion.div>

        {/* Help Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Registration */}
          <HelpSection
            title={t('help.registration.title')}
            icon={<UserPlus className="w-5 h-5" />}
            defaultOpen={true}
          >
            <h4 className="text-white font-medium">{t('help.registration.create')}</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>{t('help.registration.step1')}</li>
              <li>{t('help.registration.step2')}</li>
              <li>{t('help.registration.step3')}</li>
              <li>{t('help.registration.step4')}</li>
            </ol>

            <h4 className="text-white font-medium mt-4">{t('help.registration.recovery')}</h4>
            <p>{t('help.registration.recoveryDesc')}</p>
          </HelpSection>

          {/* Login */}
          <HelpSection
            title={t('help.login.title')}
            icon={<LogIn className="w-5 h-5" />}
          >
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>{t('help.login.step1')}</li>
              <li>{t('help.login.step2')}</li>
              <li>{t('help.login.step3')}</li>
            </ol>
          </HelpSection>

          {/* Dashboard */}
          <HelpSection
            title={t('help.dashboard.title')}
            icon={<LayoutDashboard className="w-5 h-5" />}
          >
            <p>{t('help.dashboard.desc')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-emerald-400">{t('help.dashboard.stats')}</span> - {t('help.dashboard.statsDesc')}</li>
              <li><span className="text-emerald-400">{t('help.dashboard.calendar')}</span> - {t('help.dashboard.calendarDesc')}</li>
              <li><span className="text-emerald-400">{t('help.dashboard.jobs')}</span> - {t('help.dashboard.jobsDesc')}</li>
            </ul>
          </HelpSection>

          {/* Request Service */}
          <HelpSection
            title={t('help.request.title')}
            icon={<FileText className="w-5 h-5" />}
          >
            <h4 className="text-white font-medium">{t('help.request.step1Title')}</h4>
            <p className="mb-3">{t('help.request.step1Desc')}</p>

            <h4 className="text-white font-medium">{t('help.request.step2Title')}</h4>
            <p className="mb-3">{t('help.request.step2Desc')}</p>

            <h4 className="text-white font-medium">{t('help.request.step3Title')}</h4>
            <p>{t('help.request.step3Desc')}</p>
          </HelpSection>

          {/* Services */}
          <HelpSection
            title={t('help.services.title')}
            icon={<Plane className="w-5 h-5" />}
          >
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Plane className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{t('service.fumigation.title')}</span>
                  <p className="text-sm">{t('help.services.fumigation')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Leaf className="w-5 h-5 text-teal-400 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{t('service.painting.title')}</span>
                  <p className="text-sm">{t('help.services.painting')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{t('service.mapping.title')}</span>
                  <p className="text-sm">{t('help.services.mapping')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mountain className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{t('service.elevation.title')}</span>
                  <p className="text-sm">{t('help.services.elevation')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{t('service.rental.title')}</span>
                  <p className="text-sm">{t('help.services.rental')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Wrench className="w-5 h-5 text-pink-400 mt-0.5" />
                <div>
                  <span className="text-white font-medium">{t('service.repair.title')}</span>
                  <p className="text-sm">{t('help.services.repair')}</p>
                </div>
              </div>
            </div>
          </HelpSection>

          {/* Status */}
          <HelpSection
            title={t('help.status.title')}
            icon={<Clock className="w-5 h-5" />}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-white">{t('dashboard.pending')}</span>
                <span className="text-white/50">-</span>
                <span>{t('help.status.pending')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-white">{t('dashboard.confirmed')}</span>
                <span className="text-white/50">-</span>
                <span>{t('help.status.confirmed')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="text-white">{t('dashboard.inProgress')}</span>
                <span className="text-white/50">-</span>
                <span>{t('help.status.inProgress')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-white">{t('dashboard.completed')}</span>
                <span className="text-white/50">-</span>
                <span>{t('help.status.completed')}</span>
              </div>
            </div>
          </HelpSection>

          {/* Offline Mode */}
          <HelpSection
            title={t('help.offline.title')}
            icon={<WifiOff className="w-5 h-5" />}
          >
            <p>{t('help.offline.desc')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>{t('help.offline.feature1')}</li>
              <li>{t('help.offline.feature2')}</li>
              <li>{t('help.offline.feature3')}</li>
            </ul>
          </HelpSection>

          {/* FAQ */}
          <HelpSection
            title={t('help.faq.title')}
            icon={<MessageCircleQuestion className="w-5 h-5" />}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium">{t('help.faq.q1')}</h4>
                <p>{t('help.faq.a1')}</p>
              </div>
              <div>
                <h4 className="text-white font-medium">{t('help.faq.q2')}</h4>
                <p>{t('help.faq.a2')}</p>
              </div>
              <div>
                <h4 className="text-white font-medium">{t('help.faq.q3')}</h4>
                <p>{t('help.faq.a3')}</p>
              </div>
              <div>
                <h4 className="text-white font-medium">{t('help.faq.q4')}</h4>
                <p>{t('help.faq.a4')}</p>
              </div>
            </div>
          </HelpSection>
        </motion.div>
      </main>
    </div>
  )
}
