import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { parseClientPrincipal, isAuthenticated } from '../shared/auth'
import { getGitHubPAT, getFileFromGitHub } from '../shared/github'

async function getFile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('getFile function invoked')

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

  // Parse request parameters
  const owner = request.query.get('owner')
  const repo = request.query.get('repo')
  const path = request.query.get('path')
  const branch = request.query.get('branch') || 'main'

  if (!owner || !repo || !path) {
    return {
      status: 400,
      jsonBody: { error: 'Missing required parameters: owner, repo, path' },
    }
  }

  try {
    const result = await getFileFromGitHub(githubPAT, { owner, repo, path, branch })

    return {
      status: 200,
      jsonBody: result,
    }
  } catch (error) {
    context.error('GitHub API error:', error)
    return {
      status: 502,
      jsonBody: { error: `Failed to fetch file from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}` },
    }
  }
}

app.http('getFile', {
  methods: ['GET'],
  authLevel: 'anonymous', // Auth handled by Azure SWA + our x-ms-client-principal check
  handler: getFile,
})
