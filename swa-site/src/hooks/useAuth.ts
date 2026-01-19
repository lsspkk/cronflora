import { useState, useEffect } from 'react'
import { UserInfo, ClientPrincipal } from '../types'

// Debug helper - comment out the console.log line to disable debugging
function debug(message: string, data?: any) {
  if (data !== undefined) {
    //console.log(`[AUTH DEBUG] ${message}`, JSON.stringify(data, null, 2))
  } else {
    //console.log(`[AUTH DEBUG] ${message}`)
  }
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/.auth/me')
        const data: ClientPrincipal = await response.json()
        debug('Full auth response:', data)

        if (data.clientPrincipal) {
          // Extract GitHub access token from claims
          let accessToken: string | undefined

          if (data.clientPrincipal.claims) {
            debug('All claims:', data.clientPrincipal.claims)

            // Try multiple possible claim types for GitHub access token
            const tokenClaim = data.clientPrincipal.claims.find(
              (c: any) =>
                c.typ === 'urn:github:access_token' ||
                c.typ === 'access_token' ||
                c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/access_token' ||
                (c.typ?.toLowerCase().includes('github') && c.typ?.toLowerCase().includes('token')),
            )

            if (tokenClaim) {
              accessToken = tokenClaim.val
              debug(`Found token in claim type: ${tokenClaim.typ}`)
            }
          }

          // If no token found, try direct property
          if (!accessToken && (data.clientPrincipal as any).accessToken) {
            accessToken = (data.clientPrincipal as any).accessToken
            debug('Found token as direct property')
          }

          // Fallback: Use GitHub PAT from env for local dev (SWA CLI limitation)
          if (!accessToken && import.meta.env.VITE_GITHUB_PAT) {
            accessToken = import.meta.env.VITE_GITHUB_PAT
            debug('Using GitHub PAT from environment (local dev fallback)')
          }

          debug('Access token status:', accessToken ? 'FOUND' : 'NOT FOUND')

          setUser({
            ...data.clientPrincipal,
            accessToken: accessToken,
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
