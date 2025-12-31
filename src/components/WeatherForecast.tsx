import { useState, useEffect } from 'react'
import { Cloud, Droplets, Wind, Thermometer, Sun, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import {
  fetchWeatherForecast,
  getClientLocation,
  getForecastForDate,
  getForecastsForDateRange,
  getWeatherIcon,
  getWeatherDescriptionKey,
  isDroneWeatherGood,
  getWindDirectionText,
  type WeatherForecast as WeatherForecastType
} from '../services/weatherService'

interface WeatherForecastProps {
  selectedDate: string
  selectedEndDate?: string
  isRental?: boolean
}

export default function WeatherForecast({ selectedDate, selectedEndDate, isRental }: WeatherForecastProps) {
  const { t } = useLanguage()
  const [forecasts, setForecasts] = useState<WeatherForecastType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationName, setLocationName] = useState<string>('')

  useEffect(() => {
    async function loadWeather() {
      if (!selectedDate) return

      setLoading(true)
      setError(null)

      try {
        // Get client's location first
        const location = await getClientLocation()

        // Fetch weather for client's location
        const response = await fetchWeatherForecast(location.lat, location.lon)
        if (response) {
          setForecasts(response.forecasts)
          setLocationName(location.name || response.location.name || '')
        } else {
          setError('weather.errorLoading')
        }
      } catch {
        setError('weather.errorLoading')
      } finally {
        setLoading(false)
      }
    }

    loadWeather()
  }, [selectedDate])

  if (!selectedDate) return null

  if (loading) {
    return (
      <div className="glass rounded-xl p-4 mt-4 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
        <span className="text-white/60 text-sm">{t('weather.loading')}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-4 mt-4 border border-yellow-500/30 bg-yellow-500/10">
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <Cloud className="w-4 h-4" />
          {t(error)}
        </div>
      </div>
    )
  }

  // For rental: show range forecast
  if (isRental && selectedEndDate) {
    const rangeForecasts = getForecastsForDateRange(forecasts, selectedDate, selectedEndDate)

    if (rangeForecasts.length === 0) {
      return (
        <div className="glass rounded-xl p-4 mt-4 border border-white/10">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Cloud className="w-4 h-4" />
            {t('weather.noForecast')}
          </div>
        </div>
      )
    }

    // Calculate overall conditions for the range
    const avgTemp = rangeForecasts.reduce((acc, f) => acc + f.temperatureMean, 0) / rangeForecasts.length
    const maxPrecipProb = Math.max(...rangeForecasts.map(f => f.precipitationProbability))
    const totalPrecip = rangeForecasts.reduce((acc, f) => acc + f.precipitation, 0)
    const worstCondition = rangeForecasts.reduce((worst, f) => {
      const condition = isDroneWeatherGood(f)
      if (condition === 'poor') return 'poor'
      if (condition === 'moderate' && worst !== 'poor') return 'moderate'
      return worst
    }, 'good' as 'good' | 'moderate' | 'poor')

    return (
      <div className="glass rounded-xl p-4 mt-4 border border-purple-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sun className="w-5 h-5 text-purple-400" />
            <h4 className="text-white font-medium">{t('weather.rentalForecast')}</h4>
          </div>
          {locationName && (
            <span className="text-white/50 text-xs">📍 {locationName}</span>
          )}
        </div>

        {/* Overall summary */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <Thermometer className="w-4 h-4 mx-auto text-orange-400 mb-1" />
            <div className="text-white font-medium">{Math.round(avgTemp)}°C</div>
            <div className="text-white/50 text-xs">{t('weather.avgTemp')}</div>
          </div>
          <div className="text-center">
            <Droplets className="w-4 h-4 mx-auto text-blue-400 mb-1" />
            <div className="text-white font-medium">{maxPrecipProb}%</div>
            <div className="text-white/50 text-xs">{t('weather.maxPrecipProb')}</div>
          </div>
          <div className="text-center">
            <Cloud className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <div className="text-white font-medium">{totalPrecip.toFixed(1)}mm</div>
            <div className="text-white/50 text-xs">{t('weather.totalPrecip')}</div>
          </div>
        </div>

        {/* Daily breakdown (scrollable) */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
          {rangeForecasts.map((forecast, index) => {
            const condition = isDroneWeatherGood(forecast)
            const conditionColors = {
              good: 'border-emerald-500/30 bg-emerald-500/10',
              moderate: 'border-yellow-500/30 bg-yellow-500/10',
              poor: 'border-red-500/30 bg-red-500/10'
            }

            return (
              <div
                key={index}
                className={`flex-shrink-0 w-20 rounded-lg p-2 border ${conditionColors[condition]} text-center`}
              >
                <div className="text-white/60 text-xs mb-1">
                  {new Date(forecast.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="text-2xl mb-1">{getWeatherIcon(forecast.pictocode)}</div>
                <div className="text-white text-sm font-medium">
                  {Math.round(forecast.temperatureMax)}°
                </div>
                <div className="text-white/50 text-xs">
                  {Math.round(forecast.temperatureMin)}°
                </div>
              </div>
            )
          })}
        </div>

        {/* Overall condition warning */}
        <DroneConditionBadge condition={worstCondition} t={t} isRange />
      </div>
    )
  }

  // Single day forecast
  const forecast = getForecastForDate(forecasts, selectedDate)

  if (!forecast) {
    return (
      <div className="glass rounded-xl p-4 mt-4 border border-white/10">
        <div className="flex items-center gap-2 text-white/60 text-sm">
          <Cloud className="w-4 h-4" />
          {t('weather.noForecast')}
        </div>
      </div>
    )
  }

  const condition = isDroneWeatherGood(forecast)

  return (
    <div className="glass rounded-xl p-4 mt-4 border border-emerald-500/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-emerald-400" />
          <h4 className="text-white font-medium">{t('weather.forecast')}</h4>
        </div>
        {locationName && (
          <span className="text-white/50 text-xs">📍 {locationName}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Weather Icon & Description */}
        <div className="text-center">
          <div className="text-4xl mb-1">{getWeatherIcon(forecast.pictocode)}</div>
          <div className="text-white/60 text-xs">{t(getWeatherDescriptionKey(forecast.pictocode))}</div>
        </div>

        {/* Weather Details */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-white text-sm font-medium">
                {Math.round(forecast.temperatureMax)}° / {Math.round(forecast.temperatureMin)}°
              </div>
              <div className="text-white/50 text-xs">{t('weather.temperature')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-white text-sm font-medium">{forecast.precipitationProbability}%</div>
              <div className="text-white/50 text-xs">{t('weather.precipitation')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-white text-sm font-medium">
                {Math.round(forecast.windSpeed * 3.6)} km/h {getWindDirectionText(forecast.windDirection)}
              </div>
              <div className="text-white/50 text-xs">{t('weather.wind')}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-yellow-400" />
            <div>
              <div className="text-white text-sm font-medium">{forecast.uvIndex}</div>
              <div className="text-white/50 text-xs">{t('weather.uvIndex')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Drone operation recommendation */}
      <DroneConditionBadge condition={condition} t={t} />
    </div>
  )
}

// Component for drone condition badge
function DroneConditionBadge({
  condition,
  t,
  isRange = false
}: {
  condition: 'good' | 'moderate' | 'poor'
  t: (key: string) => string
  isRange?: boolean
}) {
  const configs = {
    good: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      key: isRange ? 'weather.droneGoodRange' : 'weather.droneGood'
    },
    moderate: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      key: isRange ? 'weather.droneModerateRange' : 'weather.droneModerate'
    },
    poor: {
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      key: isRange ? 'weather.dronePoorRange' : 'weather.dronePoor'
    }
  }

  const config = configs[condition]
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 mt-3 p-2 rounded-lg ${config.bg} border ${config.border}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm ${config.color}`}>{t(config.key)}</span>
    </div>
  )
}
