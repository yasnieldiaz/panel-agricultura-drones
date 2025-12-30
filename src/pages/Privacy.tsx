import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plane, ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Mail, Clock, FileText } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'

export default function Privacy() {
  const { t } = useLanguage()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    {
      icon: Shield,
      titleKey: 'privacy.section1.title',
      contentKey: 'privacy.section1.content'
    },
    {
      icon: Database,
      titleKey: 'privacy.section2.title',
      contentKey: 'privacy.section2.content'
    },
    {
      icon: Eye,
      titleKey: 'privacy.section3.title',
      contentKey: 'privacy.section3.content'
    },
    {
      icon: Lock,
      titleKey: 'privacy.section4.title',
      contentKey: 'privacy.section4.content'
    },
    {
      icon: UserCheck,
      titleKey: 'privacy.section5.title',
      contentKey: 'privacy.section5.content'
    },
    {
      icon: Clock,
      titleKey: 'privacy.section6.title',
      contentKey: 'privacy.section6.content'
    },
    {
      icon: FileText,
      titleKey: 'privacy.section7.title',
      contentKey: 'privacy.section7.content'
    },
    {
      icon: Mail,
      titleKey: 'privacy.section8.title',
      contentKey: 'privacy.section8.content'
    }
  ]

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DroneGarden</span>
            </Link>

            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link to="/auth" className="btn-primary text-sm">
                {t('nav.start')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('privacy.back')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            {t('privacy.title')}
          </h1>
          <p className="text-white/60">{t('privacy.lastUpdated')}: 30/12/2024</p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <p className="text-white/80 leading-relaxed">
            {t('privacy.intro')}
          </p>
        </motion.div>

        {/* GDPR Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-emerald-400 font-semibold">{t('privacy.gdprCompliant')}</h3>
            <p className="text-white/60 text-sm">{t('privacy.gdprDescription')}</p>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {t(section.titleKey)}
                  </h2>
                  <p className="text-white/70 leading-relaxed whitespace-pre-line">
                    {t(section.contentKey)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact for Privacy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 glass rounded-2xl p-6 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-2">{t('privacy.contact.title')}</h3>
          <p className="text-white/60 mb-4">{t('privacy.contact.description')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:admin@drone-partss.com"
              className="btn-primary inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              admin@drone-partss.com
            </a>
          </div>
          <p className="text-white/40 text-sm mt-4">
            Ul. Smolna 14, 44-200 Rybnik, Poland
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative py-8 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">DroneGarden</span>
            </Link>
            <p className="text-white/40 text-sm">
              © 2024 DroneGarden. {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
