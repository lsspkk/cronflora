export interface UserInfo {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

export interface ClientPrincipal {
  clientPrincipal: UserInfo | null
}

export interface DocumentConfig {
  path: string
  description: string
  name?: string
  created?: string
}

export interface RepoConfig {
  owner: string
  repo: string
  branch: string
  documents: DocumentConfig[]
}
