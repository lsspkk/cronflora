import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { parseClientPrincipal, isAuthenticated } from '../shared/auth'
import { getGitHubPAT, getFileFromGitHub } from '../shared/github'
import { getRepoConfig } from '../shared/config'

interface DocumentConfig {
  path: string
  description: string
  name?: string
  created?: string
}

interface ConfigFile {
  documents: DocumentConfig[]
}

async function getConfig(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('getConfig function invoked')

  // Validate authentication via Azure-injected header
  const clientPrincipalHeader = request.headers.get('x-ms-client-principal')
  const principal = parseClientPrincipal(clientPrincipalHeader)

  if (!isAuthenticated(principal)) {
    context.log('Unauthorized: missing or invalid client principal')
    return {
      status: 401,
      jsonBody: { error: 'Unauthorized: authentication required' },
    }
  }

  context.log(`Authenticated user: ${principal!.userDetails} (${principal!.userId})`)

  // Get GitHub PAT from environment
  const githubPAT = getGitHubPAT()
  if (!githubPAT) {
    context.error('GITHUB_PAT environment variable not configured')
    return {
      status: 500,
      jsonBody: { error: 'Server configuration error: GitHub PAT not configured' },
    }
  }

  // Get repo config from environment
  const repoConfig = getRepoConfig()
  if (!repoConfig.owner || !repoConfig.repo) {
    context.error('GITHUB_OWNER or GITHUB_REPO environment variable not configured')
    return {
      status: 500,
      jsonBody: { error: 'Server configuration error: GitHub repository not configured' },
    }
  }

  try {
    // Fetch config file from GitHub
    const result = await getFileFromGitHub(githubPAT, {
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      path: repoConfig.configPath,
      branch: repoConfig.branch,
    })

    // Parse the config JSON
    let configFile: ConfigFile
    try {
      configFile = JSON.parse(result.content)
    } catch {
      context.error('Failed to parse config file as JSON')
      return {
        status: 500,
        jsonBody: { error: 'Invalid config file: not valid JSON' },
      }
    }

    // Return config with repo info
    return {
      status: 200,
      jsonBody: {
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        branch: repoConfig.branch,
        documents: configFile.documents || [],
      },
    }
  } catch (error) {
    context.error('GitHub API error:', error)
    return {
      status: 502,
      jsonBody: {
        error: `Failed to fetch config from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    }
  }
}

app.http('getConfig', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getConfig,
})
