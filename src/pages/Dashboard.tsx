import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plane,
  LogOut,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Plus
} from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../hooks/useAuth'
import LanguageSelector from '../components/LanguageSelector'
import ServiceRequestModal from '../components/ServiceRequestModal'

// Types
interface Job {
  id: string
  service: string
  serviceKey: string
  date: string
  location: string
  area: number
  status: 'completed' | 'scheduled' | 'pending' | 'inProgress'
}

// Mock data - In production this would come from Supabase
const mockJobs: Job[] = [
  {
    id: '1',
    service: 'Fumigación con Drones',
    serviceKey: 'service.fumigation.title',
    date: '2024-12-15',
    location: 'Finca El Olivo, Almería',
    area: 25,
    status: 'completed'
  },
  {
    id: '2',
    service: 'Mapeo Aéreo',
    serviceKey: 'service.mapping.title',
    date: '2024-12-20',
    location: 'Campo Verde, Granada',
    area: 40,
    status: 'completed'
  },
  {
    id: '3',
    service: 'Pintura de Invernaderos',
    serviceKey: 'service.painting.title',
    date: '2025-01-10',
    location: 'Invernaderos Sol, Murcia',
    area: 15,
    status: 'scheduled'
  },
  {
    id: '4',
    service: 'Fumigación con Drones',
    serviceKey: 'service.fumigation.title',
    date: '2025-01-15',
    location: 'Finca El Olivo, Almería',
    area: 30,
    status: 'scheduled'
  },
  {
    id: '5',
    service: 'Modelos de Elevación',
    serviceKey: 'service.elevation.title',
    date: '2025-01-25',
    location: 'Terrenos Norte, Valencia',
    area: 50,
    status: 'pending'
  }
]

type TabType = 'all' | 'completed' | 'scheduled' | 'pending'

export default function Dashboard() {
  const { t } = useLanguage()
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [serviceModalOpen, setServiceModalOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  // Calendar helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const monthName = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Get jobs for a specific date
  const getJobsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return mockJobs.filter(job => job.date === dateStr)
  }

  // Filter jobs by tab
  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') return mockJobs
    return mockJobs.filter(job => job.status === activeTab)
  }, [activeTab])

  // Get status color
  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'inProgress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default: return 'bg-white/20 text-white/60 border-white/30'
    }
  }

  const getStatusIcon = (status: Job['status']) => {
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

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario'

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
            {t('dashboard.welcome')}, <span className="gradient-text">{userName}</span>
          </h1>
          <p className="text-white/60">{t('dashboard.title')}</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: t('dashboard.completed'), value: mockJobs.filter(j => j.status === 'completed').length, color: 'from-emerald-500 to-teal-500' },
            { label: t('dashboard.scheduled'), value: mockJobs.filter(j => j.status === 'scheduled').length, color: 'from-blue-500 to-cyan-500' },
            { label: t('dashboard.pending'), value: mockJobs.filter(j => j.status === 'pending').length, color: 'from-amber-500 to-orange-500' },
            { label: t('dashboard.all'), value: mockJobs.length, color: 'from-purple-500 to-pink-500' },
          ].map((stat, index) => (
            <div key={index} className="card-glass">
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-emerald-400" />
                  {t('dashboard.calendar')}
                </h2>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white/60" />
                </button>
                <span className="text-white font-medium capitalize">{monthName}</span>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                  <div key={day} className="text-white/40 py-2 font-medium">
                    {day}
                  </div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="py-2" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const jobsForDay = getJobsForDate(day)
                  const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                  return (
                    <div
                      key={day}
                      className={`py-2 rounded-lg relative cursor-pointer transition-colors ${
                        isToday
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      {day}
                      {jobsForDay.length > 0 && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {jobsForDay.slice(0, 3).map((job, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                job.status === 'completed' ? 'bg-emerald-500' :
                                job.status === 'scheduled' ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white/60">{t('dashboard.completed')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-white/60">{t('dashboard.scheduled')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-white/60">{t('dashboard.pending')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Jobs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-emerald-400" />
                  {t('dashboard.jobs')}
                </h2>
                <button
                  onClick={() => setServiceModalOpen(true)}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('dashboard.requestService')}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {(['all', 'completed', 'scheduled', 'pending'] as TabType[]).map((tab) => (
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

              {/* Jobs */}
              <div className="space-y-4">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    {t('dashboard.noJobs')}
                  </div>
                ) : (
                  filteredJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass-dark rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">{t(job.serviceKey)}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              {t(`dashboard.status.${job.status}`)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-white/60">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-4 h-4" />
                              {new Date(job.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-emerald-400">{job.area}</span>
                              {t('dashboard.hectares')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Service Request Modal */}
      <ServiceRequestModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
      />
    </div>
  )
}
