import { useState, useEffect } from 'react'

const DARK_MODE_KEY = 'cronflora_dark_mode'

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem(DARK_MODE_KEY)
      if (saved !== null) {
        return saved === 'true'
      }
      // Default to system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_KEY, String(isDark))
    } catch {
      // Ignore
    }
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return [isDark, toggle]
}
