export interface UserInfo {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

export interface ClientPrincipal {
  clientPrincipal: UserInfo | null
}

export interface AppConfig {
  githubOwner: string
  githubRepo: string
  githubBranch: string
  documentPath: string
}
