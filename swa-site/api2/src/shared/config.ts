/**
 * Repository configuration from environment variables.
 * These are server-side only and never exposed to the browser.
 */

export interface RepoConfig {
  owner: string
  repo: string
  branch: string
  configPath: string
}

export function getRepoConfig(): RepoConfig {
  return {
    owner: process.env.CRONFLORA_GITHUB_OWNER || '',
    repo: process.env.CRONFLORA_GITHUB_REPO || '',
    branch: process.env.CRONFLORA_GITHUB_BRANCH || 'main',
    configPath: process.env.CRONFLORA_CONFIG_PATH || 'dokumenttiprojekti/cronflora-config.json',
  }
}
