import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plane,
  Leaf,
  MapPin,
  Mountain,
  ArrowRight,
  Check,
  Phone,
  Mail,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from '../components/LanguageSelector'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  const services = [
    {
      icon: Plane,
      titleKey: 'service.fumigation.title',
      descKey: 'service.fumigation.desc',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Leaf,
      titleKey: 'service.painting.title',
      descKey: 'service.painting.desc',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: MapPin,
      titleKey: 'service.mapping.title',
      descKey: 'service.mapping.desc',
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Mountain,
      titleKey: 'service.elevation.title',
      descKey: 'service.elevation.desc',
      color: 'from-blue-500 to-indigo-500',
    },
  ]

  const stats = [
    { value: '500+', labelKey: 'stats.hectares' },
    { value: '98%', labelKey: 'stats.precision' },
    { value: '24h', labelKey: 'stats.response' },
    { value: '150+', labelKey: 'stats.clients' },
  ]

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb-green w-96 h-96 -top-48 -left-48 floating" />
        <div className="orb-teal w-80 h-80 top-1/4 right-0 floating-delayed" />
        <div className="orb-cyan w-64 h-64 bottom-0 left-1/4 floating" />
        <div className="orb-green w-72 h-72 bottom-1/4 right-1/4 floating-delayed" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">DroneGarden</span>
              </motion.div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#servicios" className="text-white/70 hover:text-white transition-colors">{t('nav.services')}</a>
              <a href="#nosotros" className="text-white/70 hover:text-white transition-colors">{t('nav.about')}</a>
              <a href="#contacto" className="text-white/70 hover:text-white transition-colors">{t('nav.contact')}</a>
              <LanguageSelector />
              <Link to="/auth" className="btn-primary flex items-center gap-2">
                {t('nav.start')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-3 md:hidden">
              <LanguageSelector />
              <button
                className="text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-4">
              <a href="#servicios" className="block text-white/70 hover:text-white">{t('nav.services')}</a>
              <a href="#nosotros" className="block text-white/70 hover:text-white">{t('nav.about')}</a>
              <a href="#contacto" className="block text-white/70 hover:text-white">{t('nav.contact')}</a>
              <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
                {t('nav.start')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-white/70">{t('hero.badge')}</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6"
            >
              <span className="text-white">{t('hero.title1')}</span>
              <br />
              <span className="gradient-text glow-text">{t('hero.title2')}</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10"
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth" className="btn-primary flex items-center gap-2 text-lg">
                {t('hero.cta')} <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#servicios" className="btn-glass flex items-center gap-2">
                {t('hero.viewServices')}
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20"
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="card-glass text-center"
                >
                  <div className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</div>
                  <div className="text-white/60 text-sm mt-1">{t(stat.labelKey)}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            />
          </div>
        </motion.div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="text-emerald-400 font-medium"
            >
              {t('services.title')}
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-2"
            >
              {t('services.subtitle')} <span className="gradient-text">{t('services.subtitleHighlight')}</span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group card-glass cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{t(service.titleKey)}</h3>
                <p className="text-white/60 text-sm">{t(service.descKey)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.span
                variants={fadeInUp}
                className="text-emerald-400 font-medium"
              >
                {t('about.title')}
              </motion.span>
              <motion.h2
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-6"
              >
                {t('about.subtitle')} <span className="gradient-text">{t('about.subtitleHighlight')}</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-white/60 mb-6"
              >
                {t('about.description')}
              </motion.p>

              <motion.div variants={fadeInUp} className="space-y-4">
                {[
                  t('about.feature1'),
                  t('about.feature2'),
                  t('about.feature3'),
                  t('about.feature4'),
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />
                <div className="relative grid grid-cols-2 gap-4">
                  <div className="card-glass text-center">
                    <div className="text-4xl font-bold gradient-text">5+</div>
                    <div className="text-white/60 text-sm">{t('about.years')}</div>
                  </div>
                  <div className="card-glass text-center">
                    <div className="text-4xl font-bold gradient-text">50+</div>
                    <div className="text-white/60 text-sm">{t('about.drones')}</div>
                  </div>
                  <div className="card-glass text-center">
                    <div className="text-4xl font-bold gradient-text">24/7</div>
                    <div className="text-white/60 text-sm">{t('about.support')}</div>
                  </div>
                  <div className="card-glass text-center">
                    <div className="text-4xl font-bold gradient-text">100%</div>
                    <div className="text-white/60 text-sm">{t('about.satisfaction')}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                {t('cta.title')} <span className="gradient-text">{t('cta.titleHighlight')}</span> {t('cta.titleEnd')}
              </h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                {t('cta.description')}
              </p>
              <Link to="/auth" className="btn-primary inline-flex items-center gap-2 text-lg">
                {t('cta.button')} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.span
                variants={fadeInUp}
                className="text-emerald-400 font-medium"
              >
                {t('contact.title')}
              </motion.span>
              <motion.h2
                variants={fadeInUp}
                className="text-3xl sm:text-4xl font-bold text-white mt-2 mb-6"
              >
                {t('contact.subtitle')} <span className="gradient-text">{t('contact.subtitleHighlight')}</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-white/60 mb-8"
              >
                {t('contact.description')}
              </motion.p>

              <motion.div variants={fadeInUp} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">{t('contact.phone')}</div>
                    <div className="text-white font-medium">+48 784 608 733</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">{t('contact.email')}</div>
                    <div className="text-white font-medium">admin@drone-partss.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm">{t('contact.address')}</div>
                    <div className="text-white font-medium">Ul. Smolna 14, 44-200 Rybnik, Poland</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <form className="glass rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder={t('contact.form.name')}
                    className="input-glass"
                  />
                  <input
                    type="email"
                    placeholder={t('contact.form.email')}
                    className="input-glass"
                  />
                </div>
                <input
                  type="text"
                  placeholder={t('contact.form.subject')}
                  className="input-glass"
                />
                <textarea
                  placeholder={t('contact.form.message')}
                  rows={4}
                  className="input-glass resize-none"
                />
                <button type="submit" className="btn-primary w-full">
                  {t('contact.form.send')}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold gradient-text">DroneGarden</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-white/40 hover:text-white/60 text-sm transition-colors">
                {t('footer.privacy')}
              </Link>
              <p className="text-white/40 text-sm">
                © 2024 DroneGarden. {t('footer.rights')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
