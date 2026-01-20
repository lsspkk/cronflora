/**
 * LocalStorage service for caching config and last opened file.
 */

import { RepoConfig } from '../types'

const CONFIG_KEY = 'cronflora_config'
const CONFIG_TIMESTAMP_KEY = 'cronflora_config_timestamp'
const LAST_FILE_KEY = 'cronflora_last_file'

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export function getCachedConfig(): RepoConfig | null {
  try {
    const timestampStr = localStorage.getItem(CONFIG_TIMESTAMP_KEY)
    if (!timestampStr) {
      return null
    }

    const timestamp = parseInt(timestampStr, 10)
    const now = Date.now()

    // Cache expired (older than 24 hours)
    if (now - timestamp > ONE_DAY_MS) {
      clearConfigCache()
      return null
    }

    const configStr = localStorage.getItem(CONFIG_KEY)
    if (!configStr) {
      return null
    }

    return JSON.parse(configStr) as RepoConfig
  } catch {
    return null
  }
}

export function setCachedConfig(config: RepoConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    localStorage.setItem(CONFIG_TIMESTAMP_KEY, Date.now().toString())
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearConfigCache(): void {
  try {
    localStorage.removeItem(CONFIG_KEY)
    localStorage.removeItem(CONFIG_TIMESTAMP_KEY)
  } catch {
    // Ignore errors
  }
}

export function getLastOpenedFile(): string | null {
  try {
    return localStorage.getItem(LAST_FILE_KEY)
  } catch {
    return null
  }
}

export function setLastOpenedFile(path: string): void {
  try {
    localStorage.setItem(LAST_FILE_KEY, path)
  } catch {
    // localStorage might be full or disabled
  }
}

export function clearLastOpenedFile(): void {
  try {
    localStorage.removeItem(LAST_FILE_KEY)
  } catch {
    // Ignore errors
  }
}
