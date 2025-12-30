import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane,
  LogOut,
  Calendar as CalendarIcon,
  List,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  User,
  Phone,
  Mail,
  Check,
  X,
  Shield,
  MessageSquare,
  Settings,
  Plus
} from 'lucide-react'
import { useLanguage, type Language } from '../contexts/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from '../components/LanguageSelector'
import ServiceRequestModal from '../components/ServiceRequestModal'
import { sendConfirmationNotifications, sendCompletionNotifications } from '../services/smsService'

// Types
interface ServiceRequest {
  id: string
  service: string
  serviceKey: string
  date: string
  time: string
  location: string
  area: number
  status: 'pending' | 'scheduled' | 'inProgress' | 'completed'
  client: {
    name: string
    email: string
    phone: string
  }
  notes?: string
  createdAt: string
}

// Mock data - In production this would come from Supabase
const mockRequests: ServiceRequest[] = [
  {
    id: '1',
    service: 'Fumigación con Drones',
    serviceKey: 'service.fumigation.title',
    date: '2024-12-15',
    time: '09:00',
    location: 'Finca El Olivo, Almería',
    area: 25,
    status: 'completed',
    client: {
      name: 'Juan García',
      email: 'juan@email.com',
      phone: '+34 600 111 222'
    },
    createdAt: '2024-12-01'
  },
  {
    id: '2',
    service: 'Mapeo Aéreo',
    serviceKey: 'service.mapping.title',
    date: '2024-12-20',
    time: '10:00',
    location: 'Campo Verde, Granada',
    area: 40,
    status: 'completed',
    client: {
      name: 'María López',
      email: 'maria@email.com',
      phone: '+34 600 333 444'
    },
    createdAt: '2024-12-05'
  },
  {
    id: '3',
    service: 'Pintura de Invernaderos',
    serviceKey: 'service.painting.title',
    date: '2025-01-10',
    time: '08:00',
    location: 'Invernaderos Sol, Murcia',
    area: 15,
    status: 'scheduled',
    client: {
      name: 'Pedro Martínez',
      email: 'pedro@email.com',
      phone: '+34 600 555 666'
    },
    notes: 'Preferiblemente por la mañana temprano',
    createdAt: '2024-12-15'
  },
  {
    id: '4',
    service: 'Fumigación con Drones',
    serviceKey: 'service.fumigation.title',
    date: '2025-01-15',
    time: '11:00',
    location: 'Finca El Olivo, Almería',
    area: 30,
    status: 'pending',
    client: {
      name: 'Juan García',
      email: 'juan@email.com',
      phone: '+34 600 111 222'
    },
    createdAt: '2024-12-20'
  },
  {
    id: '5',
    service: 'Modelos de Elevación',
    serviceKey: 'service.elevation.title',
    date: '2025-01-25',
    time: '14:00',
    location: 'Terrenos Norte, Valencia',
    area: 50,
    status: 'pending',
    client: {
      name: 'Ana Fernández',
      email: 'ana@email.com',
      phone: '+34 600 777 888'
    },
    notes: 'Zona con desnivel, necesita modelo 3D detallado',
    createdAt: '2024-12-22'
  },
  {
    id: '6',
    service: 'Fumigación con Drones',
    serviceKey: 'service.fumigation.title',
    date: '2025-01-05',
    time: '10:00',
    location: 'Finca Test, Warsaw',
    area: 20,
    status: 'pending',
    client: {
      name: 'Yasniel Díaz',
      email: 'admin@drone-partss.com',
      phone: '+48696350197'
    },
    notes: 'Solicitud de prueba para verificar SMS y Email',
    createdAt: '2024-12-30'
  }
]

type TabType = 'all' | 'pending' | 'scheduled' | 'completed'

export default function AdminDashboard() {
  const { t, language } = useLanguage()
  const { signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [requests, setRequests] = useState(mockRequests)
  const [_selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [sendingSMS, setSendingSMS] = useState<string | null>(null)
  const [smsStatus, setSmsStatus] = useState<{ id: string; success: boolean; message: string } | null>(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Filter requests by tab
  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return requests
    return requests.filter(req => req.status === activeTab)
  }, [activeTab, requests])

  // Mark request as completed and send SMS + Email
  const markAsCompleted = async (id: string) => {
    const request = requests.find(r => r.id === id)
    if (!request) return

    setSendingSMS(id)

    // Update status first
    setRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status: 'completed' as const } : req
    ))

    // Send completion notifications (SMS + Email)
    const result = await sendCompletionNotifications({
      phone: request.client.phone,
      email: request.client.email,
      clientName: request.client.name,
      service: t(request.serviceKey),
      language: language as Language
    })

    setSendingSMS(null)

    if (result.sms.success || result.email.success) {
      setSmsStatus({ id, success: true, message: t('admin.notificationsSent') })
    } else {
      setSmsStatus({ id, success: false, message: t('admin.notificationsError') })
    }

    // Clear status after 3 seconds
    setTimeout(() => setSmsStatus(null), 3000)
    setSelectedRequest(null)
  }

  // Mark request as scheduled (confirm) and send SMS + Email
  const markAsScheduled = async (id: string) => {
    const request = requests.find(r => r.id === id)
    if (!request) return

    setSendingSMS(id)

    // Update status first
    setRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status: 'scheduled' as const } : req
    ))

    // Send confirmation notifications (SMS + Email)
    const result = await sendConfirmationNotifications({
      phone: request.client.phone,
      email: request.client.email,
      clientName: request.client.name,
      service: t(request.serviceKey),
      date: new Date(request.date).toLocaleDateString(),
      time: request.time,
      location: request.location,
      area: request.area,
      language: language as Language
    })

    setSendingSMS(null)

    if (result.sms.success || result.email.success) {
      setSmsStatus({ id, success: true, message: t('admin.notificationsSent') })
    } else {
      setSmsStatus({ id, success: false, message: t('admin.notificationsError') })
    }

    // Clear status after 3 seconds
    setTimeout(() => setSmsStatus(null), 3000)
  }

  // Get status color
  const getStatusColor = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'inProgress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-white/20 text-white/60 border-white/30'
    }
  }

  const getStatusIcon = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'scheduled': return <Clock className="w-4 h-4" />
      case 'pending': return <Circle className="w-4 h-4" />
      case 'inProgress': return <Loader2 className="w-4 h-4 animate-spin" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  if (loading) {
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DroneGarden</span>
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <LanguageSelector />
              <Link
                to="/admin/settings"
                className="btn-glass flex items-center gap-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">{t('settings.title')}</span>
              </Link>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {t('admin.title')}
          </h1>
          <p className="text-white/60">{t('admin.subtitle')}</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: t('dashboard.pending'), value: requests.filter(r => r.status === 'pending').length, color: 'from-amber-500 to-orange-500' },
            { label: t('dashboard.scheduled'), value: requests.filter(r => r.status === 'scheduled').length, color: 'from-blue-500 to-cyan-500' },
            { label: t('dashboard.completed'), value: requests.filter(r => r.status === 'completed').length, color: 'from-emerald-500 to-teal-500' },
            { label: t('dashboard.all'), value: requests.length, color: 'from-purple-500 to-pink-500' },
          ].map((stat, index) => (
            <div key={index} className="card-glass">
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-400" />
                {t('admin.requests')}
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(['all', 'pending', 'scheduled', 'completed'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {t(`dashboard.${tab}`)}
                </button>
              ))}
            </div>

            {/* Requests Table */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-white/40">
                  {t('admin.noRequests')}
                </div>
              ) : (
                filteredRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{t(request.serviceKey)}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {t(`dashboard.status.${request.status}`)}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-2 text-sm text-white/60 mb-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {request.client.name}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-4 h-4" />
                            {request.client.email}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-4 h-4" />
                            {request.client.phone}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(request.date).toLocaleDateString()} - {request.time}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-white/60">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {request.location}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-emerald-400">{request.area}</span>
                            {t('dashboard.hectares')}
                          </div>
                        </div>

                        {request.notes && (
                          <div className="mt-2 text-sm text-white/40 italic">
                            "{request.notes}"
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => markAsScheduled(request.id)}
                              disabled={sendingSMS === request.id}
                              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                              {sendingSMS === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Clock className="w-4 h-4" />
                                  <MessageSquare className="w-3 h-3" />
                                </>
                              )}
                              {t('admin.confirm')}
                            </button>
                          )}
                          {(request.status === 'pending' || request.status === 'scheduled') && (
                            <button
                              onClick={() => markAsCompleted(request.id)}
                              disabled={sendingSMS === request.id}
                              className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                              {sendingSMS === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <MessageSquare className="w-3 h-3" />
                                </>
                              )}
                              {t('admin.complete')}
                            </button>
                          )}
                        </div>

                        {/* SMS Status */}
                        <AnimatePresence>
                          {smsStatus && smsStatus.id === request.id && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className={`text-xs flex items-center gap-1 ${
                                smsStatus.success ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {smsStatus.success ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              {smsStatus.message}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </main>

      {/* Floating Request Service Button */}
      <button
        onClick={() => setServiceModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/30"
      >
        <Plus className="w-5 h-5" />
        <span className="hidden sm:inline">{t('serviceRequest.floatingButton')}</span>
      </button>

      {/* Service Request Modal */}
      <ServiceRequestModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
      />
    </div>
  )
}
