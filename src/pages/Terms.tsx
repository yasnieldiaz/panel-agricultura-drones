import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, ShoppingCart, CreditCard, Truck, RotateCcw, AlertCircle, Shield, Scale, Mail } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'
import Logo from '../components/Logo'

export default function Terms() {
  const { t } = useLanguage()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const sections = [
    {
      icon: FileText,
      titleKey: 'terms.section1.title',
      contentKey: 'terms.section1.content'
    },
    {
      icon: ShoppingCart,
      titleKey: 'terms.section2.title',
      contentKey: 'terms.section2.content'
    },
    {
      icon: CreditCard,
      titleKey: 'terms.section3.title',
      contentKey: 'terms.section3.content'
    },
    {
      icon: Truck,
      titleKey: 'terms.section4.title',
      contentKey: 'terms.section4.content'
    },
    {
      icon: RotateCcw,
      titleKey: 'terms.section5.title',
      contentKey: 'terms.section5.content'
    },
    {
      icon: AlertCircle,
      titleKey: 'terms.section6.title',
      contentKey: 'terms.section6.content'
    },
    {
      icon: Shield,
      titleKey: 'terms.section7.title',
      contentKey: 'terms.section7.content'
    },
    {
      icon: Scale,
      titleKey: 'terms.section8.title',
      contentKey: 'terms.section8.content'
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
            <Link to="/">
              <Logo size="md" />
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
          {t('terms.back')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 flex items-center gap-3">
            <Scale className="w-8 h-8 text-emerald-400" />
            {t('terms.title')}
          </h1>
          <p className="text-white/60">{t('terms.lastUpdated')}: 12/01/2025</p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <p className="text-white/80 leading-relaxed">
            {t('terms.intro')}
          </p>
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

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 glass rounded-2xl p-6 text-center"
        >
          <h3 className="text-xl font-semibold text-white mb-2">{t('terms.contact.title')}</h3>
          <p className="text-white/60 mb-4">{t('terms.contact.description')}</p>
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
            IMEGA Sp. z o.o. - Ul. Smolna 14, 44-200 Rybnik, Poland
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative py-8 border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/">
              <Logo size="sm" />
            </Link>
            <p className="text-white/40 text-sm">
              © 2024 Drone Service. {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
