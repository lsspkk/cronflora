import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { parseClientPrincipal, isAuthenticated } from '../shared/auth'
import { getGitHubPAT, saveFileToGitHub } from '../shared/github'

interface SaveFileBody {
  owner: string
  repo: string
  path: string
  branch: string
  content: string
  sha: string
  message: string
}

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.log('saveFile function invoked')

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

  // Parse request body
  const body = req.body as SaveFileBody

  if (!body) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' }),
    }
    return
  }

  const { owner, repo, path, branch, content, sha, message } = body

  if (!owner || !repo || !path || content === undefined || !sha || !message) {
    context.res = {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields: owner, repo, path, content, sha, message' }),
    }
    return
  }

  try {
    const result = await saveFileToGitHub(githubPAT, {
      owner,
      repo,
      path,
      branch: branch || 'main',
      content,
      sha,
      message,
    })

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
        error: `Failed to save file to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }),
    }
  }
}

export default httpTrigger
