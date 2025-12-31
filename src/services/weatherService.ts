// Weather Service - Meteoblue API Integration

const METEOBLUE_API_KEY = '48wiNfGE9LqTSUlt'
const METEOBLUE_BASE_URL = 'https://my.meteoblue.com/packages'

// Default location: Rybnik, Poland (fallback only)
const DEFAULT_LOCATION = {
  lat: 50.0975,
  lon: 18.5415
}

// Cache for client location to avoid repeated API calls
let cachedLocation: { lat: number; lon: number; name?: string } | null = null

// Get client location from IP (using free ipapi.co service)
async function getLocationFromIP(): Promise<{ lat: number; lon: number; name: string } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (!response.ok) return null

    const data = await response.json()
    if (data.latitude && data.longitude) {
      return {
        lat: data.latitude,
        lon: data.longitude,
        name: data.city ? `${data.city}, ${data.country_name}` : data.country_name || 'Unknown'
      }
    }
    return null
  } catch (error) {
    console.error('Error getting location from IP:', error)
    return null
  }
}

// Get client location using browser Geolocation API
function getLocationFromBrowser(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      },
      () => {
        // User denied or error - silently fail and use IP fallback
        resolve(null)
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    )
  })
}

// Get client location (tries browser first, then IP, then default)
export async function getClientLocation(): Promise<{ lat: number; lon: number; name?: string }> {
  // Return cached location if available
  if (cachedLocation) {
    return cachedLocation
  }

  // Try browser geolocation first (more accurate)
  const browserLocation = await getLocationFromBrowser()
  if (browserLocation) {
    cachedLocation = browserLocation
    return browserLocation
  }

  // Fallback to IP geolocation
  const ipLocation = await getLocationFromIP()
  if (ipLocation) {
    cachedLocation = ipLocation
    return ipLocation
  }

  // Last resort: use default location
  return DEFAULT_LOCATION
}

export interface WeatherForecast {
  date: string
  temperatureMax: number
  temperatureMin: number
  temperatureMean: number
  precipitation: number
  precipitationProbability: number
  windSpeed: number
  windDirection: number
  pictocode: number
  uvIndex: number
}

export interface WeatherResponse {
  forecasts: WeatherForecast[]
  location: {
    name: string
    lat: number
    lon: number
  }
}

// Pictocode descriptions (1-17 for daily forecasts)
export const pictocodeDescriptions: Record<number, { key: string; icon: string }> = {
  1: { key: 'weather.sunny', icon: '☀️' },
  2: { key: 'weather.lightClouds', icon: '🌤️' },
  3: { key: 'weather.partlyCloudy', icon: '⛅' },
  4: { key: 'weather.cloudy', icon: '☁️' },
  5: { key: 'weather.rain', icon: '🌧️' },
  6: { key: 'weather.rainSnow', icon: '🌨️' },
  7: { key: 'weather.snow', icon: '❄️' },
  8: { key: 'weather.rainSnowShowers', icon: '🌨️' },
  9: { key: 'weather.foggy', icon: '🌫️' },
  10: { key: 'weather.lightRain', icon: '🌦️' },
  11: { key: 'weather.heavyRain', icon: '🌧️' },
  12: { key: 'weather.lightSnow', icon: '🌨️' },
  13: { key: 'weather.heavySnow', icon: '❄️' },
  14: { key: 'weather.rainShowers', icon: '🌦️' },
  15: { key: 'weather.snowShowers', icon: '🌨️' },
  16: { key: 'weather.thunderstorm', icon: '⛈️' },
  17: { key: 'weather.hail', icon: '🌩️' },
}

// Get weather icon based on pictocode
export function getWeatherIcon(pictocode: number): string {
  return pictocodeDescriptions[pictocode]?.icon || '🌡️'
}

// Get weather description key based on pictocode
export function getWeatherDescriptionKey(pictocode: number): string {
  return pictocodeDescriptions[pictocode]?.key || 'weather.unknown'
}

// Determine if weather is good for drone operations
export function isDroneWeatherGood(forecast: WeatherForecast): 'good' | 'moderate' | 'poor' {
  // Poor conditions: rain, snow, thunderstorm, fog, high winds
  if (
    forecast.pictocode >= 5 && forecast.pictocode <= 8 || // Rain/snow mix
    forecast.pictocode >= 10 && forecast.pictocode <= 17 || // Various precipitation
    forecast.windSpeed > 10 || // Wind > 10 m/s (36 km/h)
    forecast.precipitationProbability > 70
  ) {
    return 'poor'
  }

  // Moderate conditions: cloudy, light wind, some precipitation chance
  if (
    forecast.pictocode === 4 || // Cloudy
    forecast.pictocode === 9 || // Foggy
    forecast.windSpeed > 6 || // Wind > 6 m/s (21.6 km/h)
    forecast.precipitationProbability > 40
  ) {
    return 'moderate'
  }

  // Good conditions: clear, light clouds, low wind
  return 'good'
}

// Fetch weather forecast from Meteoblue API
export async function fetchWeatherForecast(
  lat: number = DEFAULT_LOCATION.lat,
  lon: number = DEFAULT_LOCATION.lon
): Promise<WeatherResponse | null> {
  try {
    const url = `${METEOBLUE_BASE_URL}/basic-day?lat=${lat}&lon=${lon}&apikey=${METEOBLUE_API_KEY}&format=json`

    const response = await fetch(url)

    if (!response.ok) {
      console.error('Meteoblue API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()

    // Parse the response
    const forecasts: WeatherForecast[] = []
    const dataDay = data.data_day

    if (dataDay && dataDay.time) {
      for (let i = 0; i < dataDay.time.length; i++) {
        forecasts.push({
          date: dataDay.time[i],
          temperatureMax: dataDay.temperature_max?.[i] ?? 0,
          temperatureMin: dataDay.temperature_min?.[i] ?? 0,
          temperatureMean: dataDay.temperature_mean?.[i] ?? 0,
          precipitation: dataDay.precipitation?.[i] ?? 0,
          precipitationProbability: dataDay.precipitation_probability?.[i] ?? 0,
          windSpeed: dataDay.windspeed_mean?.[i] ?? 0,
          windDirection: dataDay.winddirection_dominant?.[i] ?? 0,
          pictocode: dataDay.pictocode?.[i] ?? 1,
          uvIndex: dataDay.uvindex?.[i] ?? 0,
        })
      }
    }

    return {
      forecasts,
      location: {
        name: data.metadata?.name || 'Unknown',
        lat: data.metadata?.latitude || lat,
        lon: data.metadata?.longitude || lon,
      }
    }
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    return null
  }
}

// Get forecast for a specific date
export function getForecastForDate(
  forecasts: WeatherForecast[],
  targetDate: string
): WeatherForecast | null {
  return forecasts.find(f => f.date === targetDate) || null
}

// Get forecasts for a date range (for rental)
export function getForecastsForDateRange(
  forecasts: WeatherForecast[],
  startDate: string,
  endDate: string
): WeatherForecast[] {
  return forecasts.filter(f => f.date >= startDate && f.date <= endDate)
}

// Get wind direction as text
export function getWindDirectionText(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}
