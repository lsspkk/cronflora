import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
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

async function saveFile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('saveFile function invoked')

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

  // Parse request body
  let body: SaveFileBody
  try {
    body = await request.json() as SaveFileBody
  } catch {
    return {
      status: 400,
      jsonBody: { error: 'Invalid JSON body' },
    }
  }

  const { owner, repo, path, branch, content, sha, message } = body

  if (!owner || !repo || !path || !content || !sha || !message) {
    return {
      status: 400,
      jsonBody: { error: 'Missing required fields: owner, repo, path, content, sha, message' },
    }
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

    return {
      status: 200,
      jsonBody: result,
    }
  } catch (error) {
    context.error('GitHub API error:', error)
    return {
      status: 502,
      jsonBody: { error: `Failed to save file to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}` },
    }
  }
}

app.http('saveFile', {
  methods: ['POST'],
  authLevel: 'anonymous', // Auth handled by Azure SWA + our x-ms-client-principal check
  handler: saveFile,
})
