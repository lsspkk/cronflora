/**
 * GitHub API service - proxies requests through Azure Functions backend.
 * The backend uses a server-side PAT (never exposed to browser).
 * Authentication is handled by Azure SWA session cookie.
 */

export interface GitHubFile {
  content: string
  sha: string
}

interface ApiError {
  error: string
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API error: ${response.status} ${response.statusText}`
    try {
      const errorData: ApiError = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage)
  }
  return response.json()
}

export async function getFile(
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<GitHubFile> {
  const params = new URLSearchParams({ owner, repo, path, branch })

  const response = await fetch(`/api/getFile?${params}`, {
    credentials: 'include', // Include session cookie for Azure SWA auth
  })

  return handleApiResponse<GitHubFile>(response)
}

export async function saveFile(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  content: string,
  sha: string,
  message: string
): Promise<string> {
  const response = await fetch('/api/saveFile', {
    method: 'POST',
    credentials: 'include', // Include session cookie for Azure SWA auth
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      owner,
      repo,
      path,
      branch,
      content,
      sha,
      message,
    }),
  })

  const result = await handleApiResponse<{ sha: string }>(response)
  return result.sha
}
