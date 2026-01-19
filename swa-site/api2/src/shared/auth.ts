/**
 * Parse and validate the Azure SWA client principal header.
 * This header is injected by Azure infrastructure and cannot be forged by clients.
 */

export interface ClientPrincipal {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

export function parseClientPrincipal(header: string | null): ClientPrincipal | null {
  if (!header) {
    return null
  }

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf8')
    const principal = JSON.parse(decoded) as ClientPrincipal

    // Validate required fields
    if (!principal.userId || !principal.identityProvider) {
      return null
    }

    return principal
  } catch {
    return null
  }
}

export function isAuthenticated(principal: ClientPrincipal | null): boolean {
  if (!principal) {
    return false
  }

  // Check that user has 'authenticated' role (Azure SWA adds this for logged-in users)
  return principal.userRoles?.includes('authenticated') ?? false
}
