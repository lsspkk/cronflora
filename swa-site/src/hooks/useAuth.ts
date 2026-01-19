import { useState, useEffect } from 'react'
import { UserInfo, ClientPrincipal } from '../types'

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/.auth/me')
        const data: ClientPrincipal = await response.json()
        if (data.clientPrincipal) {
          // Get access token from session
          const tokenResponse = await fetch('/.auth/me', {
            headers: { 'X-MS-TOKEN-GITHUB-ACCESS-TOKEN': 'true' }
          })
          const tokenData = await tokenResponse.json()
          setUser({
            ...data.clientPrincipal,
            accessToken: tokenData.clientPrincipal?.accessToken
          })
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const login = () => {
    window.location.href = '/.auth/login/github'
  }

  const logout = () => {
    window.location.href = '/.auth/logout'
  }

  return { user, loading, login, logout }
}
