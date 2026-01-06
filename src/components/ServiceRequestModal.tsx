import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, MapPin, Plane, Leaf, Mountain, Check, Send, Loader2, AlertCircle, Truck, CalendarRange, Wrench } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { serviceRequestsApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import WeatherForecast from './WeatherForecast'

interface ServiceRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginRequired?: () => void
}

interface ServiceOption {
  id: string
  icon: typeof Plane
  titleKey: string
  color: string
}

const services: ServiceOption[] = [
  { id: 'fumigation', icon: Plane, titleKey: 'service.fumigation.title', color: 'from-emerald-500 to-teal-500' },
  { id: 'painting', icon: Leaf, titleKey: 'service.painting.title', color: 'from-teal-500 to-cyan-500' },
  { id: 'mapping', icon: MapPin, titleKey: 'service.mapping.title', color: 'from-cyan-500 to-blue-500' },
  { id: 'elevation', icon: Mountain, titleKey: 'service.elevation.title', color: 'from-blue-500 to-indigo-500' },
  { id: 'rental', icon: Truck, titleKey: 'service.rental.title', color: 'from-indigo-500 to-purple-500' },
  { id: 'repair', icon: Wrench, titleKey: 'service.repair.title', color: 'from-purple-500 to-pink-500' },
]

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]

// Map language to locale for date formatting
const languageToLocale: Record<string, string> = {
  es: 'es-ES',
  pl: 'pl-PL',
  en: 'en-US',
  cs: 'cs-CZ',
  sk: 'sk-SK'
}

export default function ServiceRequestModal({ isOpen, onClose, onLoginRequired }: ServiceRequestModalProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEndDate, setSelectedEndDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    area: '',
    notes: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRentalService = selectedService === 'rental'

  // Calculate rental days
  const rentalDays = useMemo(() => {
    if (!isRentalService || !selectedDate || !selectedEndDate) return 0
    const start = new Date(selectedDate)
    const end = new Date(selectedEndDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays > 0 ? diffDays : 0
  }, [isRentalService, selectedDate, selectedEndDate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      onLoginRequired?.()
      return
    }

    setLoading(true)
    setError(null)

    try {
      await serviceRequestsApi.create({
        service: selectedService,
        scheduledDate: selectedDate,
        scheduledEndDate: isRentalService ? selectedEndDate : undefined,
        scheduledTime: selectedTime,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        area: formData.area,
        notes: isRentalService ? `${formData.notes}\n[Días de alquiler: ${rentalDays}]` : formData.notes
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar solicitud')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setStep(1)
    setSelectedService('')
    setSelectedDate('')
    setSelectedEndDate('')
    setSelectedTime('')
    setFormData({ name: '', email: '', phone: '', location: '', area: '', notes: '' })
    setSubmitted(false)
    setError(null)
    setLoading(false)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const canProceedStep1 = selectedService !== ''
  const canProceedStep2 = isRentalService
    ? selectedDate !== '' && selectedEndDate !== '' && selectedTime !== '' && rentalDays > 0
    : selectedDate !== '' && selectedTime !== ''
  const canSubmit = formData.name && formData.email && formData.phone && formData.location

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[calc(100vh-2rem)] glass rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {t('serviceRequest.title')}
                </h2>
                {!submitted && (
                  <p className="text-white/60 text-sm mt-1">
                    {t('serviceRequest.step')} {step} {t('serviceRequest.of')} 3
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-xl glass flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t('serviceRequest.success.title')}
                  </h3>
                  <p className="text-white/60 mb-6">
                    {t('serviceRequest.success.message')}
                  </p>
                  <button
                    onClick={handleClose}
                    className="btn-primary"
                  >
                    {t('serviceRequest.success.close')}
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Step 1: Select Service */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {t('serviceRequest.selectService')}
                      </h3>
                      <div className="flex flex-wrap justify-center gap-3">
                        {services.map((service) => (
                          <button
                            key={service.id}
                            onClick={() => setSelectedService(service.id)}
                            className={`p-4 rounded-xl border-2 transition-all w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] ${
                              selectedService === service.id
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mx-auto mb-3`}>
                              <service.icon className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-white font-medium text-sm">
                              {t(service.titleKey)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Select Date & Time */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {isRentalService ? (
                        <>
                          {/* Rental Date Range */}
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CalendarRange className="w-5 h-5 text-purple-400" />
                            {t('serviceRequest.rental.dateRange')}
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-white/60 text-sm mb-2">
                                {t('serviceRequest.rental.startDate')}
                              </label>
                              <input
                                type="date"
                                min={today}
                                value={selectedDate}
                                onChange={(e) => {
                                  setSelectedDate(e.target.value)
                                  // Reset end date if it's before start date
                                  if (selectedEndDate && e.target.value > selectedEndDate) {
                                    setSelectedEndDate('')
                                  }
                                }}
                                lang={languageToLocale[language]}
                                className="input-glass w-full"
                              />
                            </div>
                            <div>
                              <label className="block text-white/60 text-sm mb-2">
                                {t('serviceRequest.rental.endDate')}
                              </label>
                              <input
                                type="date"
                                min={selectedDate || today}
                                value={selectedEndDate}
                                onChange={(e) => setSelectedEndDate(e.target.value)}
                                lang={languageToLocale[language]}
                                className="input-glass w-full"
                                disabled={!selectedDate}
                              />
                            </div>
                          </div>

                          {/* Rental Days Summary */}
                          {rentalDays > 0 && (
                            <div className="glass rounded-xl p-4 mb-6 border border-purple-500/30 bg-purple-500/10">
                              <div className="flex items-center justify-between">
                                <span className="text-white/80">{t('serviceRequest.rental.totalDays')}</span>
                                <span className="text-2xl font-bold text-purple-400">{rentalDays} {rentalDays === 1 ? t('serviceRequest.rental.day') : t('serviceRequest.rental.days')}</span>
                              </div>
                            </div>
                          )}

                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            {t('serviceRequest.rental.pickupTime')}
                          </h3>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-400" />
                            {t('serviceRequest.selectDate')}
                          </h3>
                          <input
                            type="date"
                            min={today}
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            lang={languageToLocale[language]}
                            className="input-glass w-full mb-6"
                          />

                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-400" />
                            {t('serviceRequest.selectTime')}
                          </h3>
                        </>
                      )}

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedTime === time
                                ? isRentalService ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>

                      {/* Weather Forecast */}
                      {selectedDate && (
                        <WeatherForecast
                          selectedDate={selectedDate}
                          selectedEndDate={isRentalService ? selectedEndDate : undefined}
                          isRental={isRentalService}
                        />
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Contact Details */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white/60 text-sm mb-1">
                              {t('serviceRequest.form.name')} *
                            </label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className="input-glass w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">
                              {t('serviceRequest.form.email')} *
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="input-glass w-full"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white/60 text-sm mb-1">
                              {t('serviceRequest.form.phone')} *
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="input-glass w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">
                              {t('serviceRequest.form.area')}
                            </label>
                            <input
                              type="text"
                              name="area"
                              value={formData.area}
                              onChange={handleInputChange}
                              placeholder={t('serviceRequest.form.areaPlaceholder')}
                              className="input-glass w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {t('serviceRequest.form.location')} *
                          </label>
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder={t('serviceRequest.form.locationPlaceholder')}
                            className="input-glass w-full"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-white/60 text-sm mb-1">
                            {t('serviceRequest.form.notes')}
                          </label>
                          <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder={t('serviceRequest.form.notesPlaceholder')}
                            className="input-glass w-full resize-none"
                          />
                        </div>

                        {/* Summary */}
                        <div className={`glass rounded-xl p-4 mt-4 ${isRentalService ? 'border border-purple-500/30' : ''}`}>
                          <h4 className="text-white font-medium mb-3">{t('serviceRequest.summary')}</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-white/60">{t('serviceRequest.summaryService')}</span>
                              <span className={isRentalService ? 'text-purple-400 font-medium' : 'text-white'}>{t(`service.${selectedService}.title`)}</span>
                            </div>
                            {isRentalService ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-white/60">{t('serviceRequest.rental.startDate')}</span>
                                  <span className="text-white">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(languageToLocale[language], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/60">{t('serviceRequest.rental.endDate')}</span>
                                  <span className="text-white">{new Date(selectedEndDate + 'T00:00:00').toLocaleDateString(languageToLocale[language], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                                  <span className="text-white/60">{t('serviceRequest.rental.totalDays')}</span>
                                  <span className="text-purple-400 font-bold">{rentalDays} {rentalDays === 1 ? t('serviceRequest.rental.day') : t('serviceRequest.rental.days')}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between">
                                <span className="text-white/60">{t('serviceRequest.summaryDate')}</span>
                                <span className="text-white">{new Date(selectedDate + 'T00:00:00').toLocaleDateString(languageToLocale[language], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-white/60">{t('serviceRequest.summaryTime')}</span>
                              <span className="text-white">{selectedTime}</span>
                            </div>
                          </div>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {!submitted && (
              <div className="flex-shrink-0 p-4 sm:p-6 border-t border-white/10">
                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-500/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                <div className="flex justify-between">
                  {step > 1 ? (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="btn-glass"
                      disabled={loading}
                    >
                      {t('serviceRequest.back')}
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('serviceRequest.next')}
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit || loading}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {loading ? t('serviceRequest.sending') : t('serviceRequest.submit')}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
