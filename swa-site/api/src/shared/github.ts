/**
 * GitHub API utilities for server-side operations.
 * Uses the GITHUB_PAT environment variable (never exposed to browser).
 */

const GITHUB_API = 'https://api.github.com'

export function getGitHubPAT(): string | undefined {
  return process.env.FUNCTIONS_API_GITHUB_PAT
}

export interface GitHubFileResponse {
  content: string
  sha: string
  encoding: string
  name: string
  path: string
}

export interface GetFileParams {
  owner: string
  repo: string
  path: string
  branch: string
}

export interface SaveFileParams {
  owner: string
  repo: string
  path: string
  branch: string
  content: string
  sha: string
  message: string
}

export async function getFileFromGitHub(
  token: string,
  params: GetFileParams
): Promise<{ content: string; sha: string }> {
  const { owner, repo, path, branch } = params

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CronFlora-SWA-API',
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data: GitHubFileResponse = await response.json()

  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf8')

  return { content, sha: data.sha }
}

export async function saveFileToGitHub(
  token: string,
  params: SaveFileParams
): Promise<{ sha: string }> {
  const { owner, repo, path, branch, content, sha, message } = params

  // Encode content to base64
  const encodedContent = Buffer.from(content, 'utf8').toString('base64')

  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'CronFlora-SWA-API',
      },
      body: JSON.stringify({
        message,
        content: encodedContent,
        sha,
        branch,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  return { sha: data.content.sha }
}
