import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { parseClientPrincipal, isAuthenticated } from '../shared/auth'
import { getGitHubPAT, getFileFromGitHub } from '../shared/github'

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log('getFile function invoked')

  // Validate authentication via Azure-injected header
  const clientPrincipalHeader = req.headers['x-ms-client-principal'] as string | undefined
  const principal = parseClientPrincipal(clientPrincipalHeader ?? null)

  if (!isAuthenticated(principal)) {
    context.log('Unauthorized: missing or invalid client principal')
    context.res = {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized: authentication required' }),
    }
    return
  }

  context.log(`Authenticated user: ${principal!.userDetails} (${principal!.userId})`)

  // Get GitHub PAT from environment
  const githubPAT = getGitHubPAT()
  if (!githubPAT) {
    context.log.error('GITHUB_PAT environment variable not configured')
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error: GitHub PAT not configured' }),
    }
    return
  }

  // Parse request parameters
  const owner = req.query.owner
  const repo = req.query.repo
  const path = req.query.path
  const branch = req.query.branch || 'main'

  if (!owner || !repo || !path) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required parameters: owner, repo, path' }),
    }
    return
  }

  try {
    const result = await getFileFromGitHub(githubPAT, { owner, repo, path, branch })

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }
  } catch (error) {
    context.log.error('GitHub API error:', error)
    context.res = {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: `Failed to fetch file from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
    }
  }
}

export default httpTrigger
