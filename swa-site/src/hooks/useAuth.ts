import { useState, useEffect } from 'react'
import { UserInfo, ClientPrincipal } from '../types'

/**
 * Authentication hook for Azure Static Web Apps.
 *
 * Returns user info from /.auth/me endpoint. The session cookie handles
 * authentication - no tokens are stored or managed on the frontend.
 * GitHub API access is handled by server-side Azure Functions using a PAT.
 */
export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/.auth/me')
        const data: ClientPrincipal = await response.json()

        if (data.clientPrincipal) {
          setUser({
            identityProvider: data.clientPrincipal.identityProvider,
            userId: data.clientPrincipal.userId,
            userDetails: data.clientPrincipal.userDetails,
            userRoles: data.clientPrincipal.userRoles,
          })
        } else {
          setUser(null)
        }
      } catch (err) {
        console.error('Auth error:', err)
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
