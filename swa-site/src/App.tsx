import { useState, useCallback } from 'react'
import { MenuBar } from './components/MenuBar'
import { Editor } from './components/Editor'
import { SearchReplace } from './components/SearchReplace'
import { useAuth } from './hooks/useAuth'
import { useConfig } from './hooks/useConfig'
import { getFile, saveFile } from './services/github'

function App() {
  const { user, loading, login, logout } = useAuth()
  const config = useConfig()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [fileSha, setFileSha] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const hasChanges = content !== originalContent

  const handleLoad = useCallback(async () => {
    if (!user?.accessToken) {
      setError('Please log in to load the document')
      return
    }
    try {
      setError(null)
      const file = await getFile(
        user.accessToken,
        config.githubOwner,
        config.githubRepo,
        config.documentPath,
        config.githubBranch
      )
      setContent(file.content)
      setOriginalContent(file.content)
      setFileSha(file.sha)
      setIsLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    }
  }, [user, config])

  const handleSave = useCallback(async () => {
    if (!user?.accessToken) {
      setError('Please log in to save changes')
      return
    }
    if (!fileSha) {
      setError('No file loaded')
      return
    }
    try {
      setError(null)
      setSaving(true)
      const newSha = await saveFile(
        user.accessToken,
        config.githubOwner,
        config.githubRepo,
        config.documentPath,
        config.githubBranch,
        content,
        fileSha,
        `Update ${config.documentPath}`
      )
      setFileSha(newSha)
      setOriginalContent(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setSaving(false)
    }
  }, [user, config, content, fileSha])

  const handleReplace = useCallback((search: string, replace: string, replaceAll: boolean) => {
    if (replaceAll) {
      setContent(content.split(search).join(replace))
    } else {
      const index = content.indexOf(search)
      if (index !== -1) {
        setContent(content.slice(0, index) + replace + content.slice(index + search.length))
      }
    }
  }, [content])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <MenuBar
        documentPath={config.documentPath}
        isLoaded={isLoaded}
        onLoad={handleLoad}
        onSave={handleSave}
        onSearchReplace={() => setIsSearchOpen(true)}
        hasChanges={hasChanges}
        saving={saving}
        user={user}
        onLogin={login}
        onLogout={logout}
      />

      {error && (
        <div className="bg-red-100 border-b border-red-300 text-red-700 px-4 py-2 text-sm">
          Error: {error}
        </div>
      )}

      <Editor
        content={content}
        onChange={setContent}
        disabled={!isLoaded}
      />

      <SearchReplace
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onReplace={handleReplace}
      />

      <div className="bg-gray-200 px-4 py-1 text-sm text-gray-600 flex justify-between">
        <span>
          {isLoaded ? `Editing: ${config.documentPath}` : 'No document loaded'}
        </span>
        <span>
          Lines: {content.split('\n').length} | Characters: {content.length}
        </span>
      </div>
    </div>
  )
}

export default App
