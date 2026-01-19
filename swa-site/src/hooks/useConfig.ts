import { AppConfig } from '../types'

export function useConfig(): AppConfig {
  return {
    githubOwner: import.meta.env.VITE_GITHUB_OWNER || '',
    githubRepo: import.meta.env.VITE_GITHUB_REPO || '',
    githubBranch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
    documentPath: import.meta.env.VITE_DOCUMENT_PATH || '',
  }
}
