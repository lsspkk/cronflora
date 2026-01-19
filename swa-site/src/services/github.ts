const GITHUB_API = 'https://api.github.com'

interface GitHubFileResponse {
  content: string
  sha: string
  encoding: string
}

export interface GitHubFile {
  content: string
  sha: string
}

export async function getFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<GitHubFile> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to load file: ${response.statusText}`)
  }

  const data: GitHubFileResponse = await response.json()
  const content = atob(data.content.replace(/\n/g, ''))

  return { content, sha: data.sha }
}

export async function saveFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
  content: string,
  sha: string,
  message: string
): Promise<string> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: btoa(content),
        sha,
        branch,
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to save file: ${response.statusText}`)
  }

  const data = await response.json()
  return data.content.sha
}
