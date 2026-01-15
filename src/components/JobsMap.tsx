import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Calendar, Clock, MapPin, User, Phone, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Pre-create icons once (moved outside component to prevent recreation)
const statusIcons: Record<string, L.DivIcon> = {
  pending: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#f59e0b;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }),
  confirmed: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#3b82f6;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }),
  in_progress: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#8b5cf6;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }),
  completed: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#10b981;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }),
  cancelled: L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:#ef4444;width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }),
}

interface ServiceRequest {
  id: number
  service: string
  scheduled_date: string
  scheduled_time: string
  name: string
  email: string
  phone: string
  location: string
  area: number | null
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
}

interface JobsMapProps {
  requests: ServiceRequest[]
}

interface GeocodedJob extends ServiceRequest {
  lat: number
  lng: number
}

// Persistent cache for geocoded locations (survives re-renders)
const geocodeCache: Record<string, { lat: number; lng: number } | null> = {}

// Geocode address using Nominatim - optimized with batch processing
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  if (geocodeCache[address] !== undefined) {
    return geocodeCache[address]
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'User-Agent': 'DroneAgri-Panel/1.0' } }
    )
    const data = await response.json()

    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache[address] = result
      return result
    }

    geocodeCache[address] = null
    return null
  } catch {
    geocodeCache[address] = null
    return null
  }
}

// Service name mapping
const SERVICE_KEYS: Record<string, string> = {
  'fumigation': 'service.fumigation.title',
  'mapping': 'service.mapping.title',
  'painting': 'service.painting.title',
  'rental': 'service.rental.title',
  'elevation': 'service.elevation.title',
  'repair': 'service.repair.title'
}

// Memoized FitBounds component
const FitBounds = memo(function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    }
  }, [positions.length]) // Only re-run when number of positions changes

  return null
})

// Memoized Marker component
const JobMarker = memo(function JobMarker({
  job,
  getStatusLabel,
  getStatusColor,
  t
}: {
  job: GeocodedJob
  getStatusLabel: (status: string) => string
  getStatusColor: (status: string) => string
  t: (key: string) => string
}) {
  return (
    <Marker
      position={[job.lat, job.lng]}
      icon={statusIcons[job.status] || statusIcons.pending}
    >
      <Popup>
        <div className="min-w-[200px] p-1">
          <div className="font-semibold text-gray-800 mb-2">
            {t(SERVICE_KEYS[job.service] || job.service)}
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs border mb-2 ${getStatusColor(job.status)}`}>
            {getStatusLabel(job.status)}
          </span>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>{job.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{job.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              <span>{new Date(job.scheduled_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{job.scheduled_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{job.location}</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  )
})

// Default center (Poland)
const DEFAULT_CENTER: [number, number] = [52.0, 19.0]

function JobsMap({ requests }: JobsMapProps) {
  const { t } = useLanguage()
  const [geocodedJobs, setGeocodedJobs] = useState<GeocodedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  // Memoize requests IDs to detect changes
  const requestsKey = useMemo(() =>
    requests.map(r => `${r.id}-${r.location}`).join(','),
    [requests]
  )

  // Geocode jobs - optimized with parallel processing
  useEffect(() => {
    let cancelled = false

    const geocodeJobs = async () => {
      setLoading(true)
      const results: GeocodedJob[] = []

      // Process in batches of 3 to respect rate limits but be faster
      const batchSize = 3
      for (let i = 0; i < requests.length; i += batchSize) {
        if (cancelled) break

        const batch = requests.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(async (request) => {
            if (!request.location) return null
            const coords = await geocodeAddress(request.location)
            return coords ? { ...request, ...coords } : null
          })
        )

        results.push(...batchResults.filter((r): r is GeocodedJob => r !== null))

        // Small delay between batches
        if (i + batchSize < requests.length) {
          await new Promise(resolve => setTimeout(resolve, 150))
        }
      }

      if (!cancelled) {
        setGeocodedJobs(results)
        setLoading(false)
      }
    }

    if (requests.length > 0) {
      geocodeJobs()
    } else {
      setLoading(false)
      setGeocodedJobs([])
    }

    return () => { cancelled = true }
  }, [requestsKey])

  // Memoized filtered jobs
  const filteredJobs = useMemo(() => {
    if (filter === 'all') return geocodedJobs
    if (filter === 'future') return geocodedJobs.filter(j =>
      j.status === 'pending' || j.status === 'confirmed' || j.status === 'in_progress'
    )
    if (filter === 'completed') return geocodedJobs.filter(j => j.status === 'completed')
    return geocodedJobs.filter(j => j.status === filter)
  }, [geocodedJobs, filter])

  // Memoized positions
  const positions = useMemo(() =>
    filteredJobs.map(job => [job.lat, job.lng] as [number, number]),
    [filteredJobs]
  )

  // Memoized callbacks
  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'pending': return t('dashboard.pending')
      case 'confirmed': return t('dashboard.confirmed')
      case 'in_progress': return t('admin.status.inProgress')
      case 'completed': return t('dashboard.completed')
      case 'cancelled': return t('admin.status.cancelled')
      default: return status
    }
  }, [t])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'in_progress': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-white/20 text-white/60 border-white/30'
    }
  }, [])

  // Memoized filter options
  const filterOptions = useMemo(() => [
    { id: 'all', label: t('dashboard.all') },
    { id: 'future', label: t('admin.map.future') },
    { id: 'completed', label: t('dashboard.completed') },
  ], [t])

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-400" />
          {t('admin.map.title')}
        </h2>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-white/60">{t('dashboard.pending')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-white/60">{t('dashboard.confirmed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-white/60">{t('admin.status.inProgress')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-white/60">{t('dashboard.completed')}</span>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden" style={{ height: '400px' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-800/50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <span className="text-white/60 text-sm">{t('admin.map.loading')}</span>
            </div>
          </div>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          className="rounded-xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {positions.length > 0 && <FitBounds positions={positions} />}

          {filteredJobs.map((job) => (
            <JobMarker
              key={job.id}
              job={job}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
              t={t}
            />
          ))}
        </MapContainer>

        <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-2 text-sm z-[1000]">
          <span className="text-white/60">{t('admin.map.showing')}:</span>
          <span className="text-white font-medium ml-1">{filteredJobs.length}</span>
          <span className="text-white/60 ml-1">{t('admin.map.locations')}</span>
        </div>
      </div>
    </div>
  )
}

export default memo(JobsMap)
