const CACHE_PREFIX = 'app_cache_'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry<T> {
  data: T
  timestamp: number
}

export const cache = {
  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    }
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
    } catch (e) {
      console.warn('Cache write failed:', e)
    }
  },

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return null

      const entry: CacheEntry<T> = JSON.parse(item)

      // Check if cache is expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        this.remove(key)
        return null
      }

      return entry.data
    } catch {
      return null
    }
  },

  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key)
  },

  clear(): void {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX))
    keys.forEach(k => localStorage.removeItem(k))
  },

  // Get timestamp of cached data
  getTimestamp(key: string): number | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return null
      const entry = JSON.parse(item)
      return entry.timestamp
    } catch {
      return null
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  USER: 'current_user',
  SERVICE_REQUESTS: 'service_requests',
  ALL_SERVICE_REQUESTS: 'all_service_requests',
  USERS: 'admin_users'
}
