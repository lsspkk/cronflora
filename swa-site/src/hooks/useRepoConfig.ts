import { useState, useEffect, useCallback } from 'react'
import { RepoConfig } from '../types'
import { getConfig } from '../services/github'
import { getCachedConfig, setCachedConfig, clearConfigCache } from '../services/storage'

interface UseRepoConfigResult {
  config: RepoConfig | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useRepoConfig(isAuthenticated: boolean): UseRepoConfigResult {
  const [config, setConfig] = useState<RepoConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async (forceRefresh = false) => {
    if (!isAuthenticated) {
      setConfig(null)
      return
    }

    // Try cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedConfig()
      if (cached) {
        setConfig(cached)
        return
      }
    }

    // Fetch from API
    setLoading(true)
    setError(null)

    try {
      const result = await getConfig()
      setConfig(result)
      setCachedConfig(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config')
      setConfig(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch on mount and when auth changes
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const refetch = useCallback(async () => {
    clearConfigCache()
    await fetchConfig(true)
  }, [fetchConfig])

  return { config, loading, error, refetch }
}
