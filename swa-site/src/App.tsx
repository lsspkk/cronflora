import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { LoginPage } from './components/LoginPage'
import { useAuth } from './hooks/useAuth'
import { useRepoConfig } from './hooks/useRepoConfig'
import { getFile, saveFile } from './services/github'
import { getLastOpenedFile, setLastOpenedFile } from './services/storage'
import { DocumentConfig } from './types'

// Lazy load heavy components only after authentication
const MenuBar = lazy(() => import('./components/MenuBar').then((m) => ({ default: m.MenuBar })))
const Editor = lazy(() => import('./components/Editor').then((m) => ({ default: m.Editor })))
const SearchReplace = lazy(() => import('./components/SearchReplace').then((m) => ({ default: m.SearchReplace })))

function App() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const { config, loading: configLoading, error: configError } = useRepoConfig(!!user)

  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [fileSha, setFileSha] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)

  const hasChanges = content !== originalContent

  // Load file from GitHub
  const loadFile = useCallback(async (path: string) => {
    if (!user) {
      setError('Please log in to load the document')
      return
    }

    setFileLoading(true)
    setError(null)

    try {
      const file = await getFile(path)
      setContent(file.content)
      setOriginalContent(file.content)
      setFileSha(file.sha)
      setSelectedPath(path)
      setLastOpenedFile(path)
      setIsLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setFileLoading(false)
    }
  }, [user])

  // Auto-load last opened file when config is ready
  useEffect(() => {
    if (!user || !config || configLoading || isLoaded || fileLoading) {
      return
    }

    const lastPath = getLastOpenedFile()
    if (lastPath) {
      // Check if the last file still exists in config
      const exists = config.documents.some((d) => d.path === lastPath)
      if (exists) {
        loadFile(lastPath)
      }
    }
  }, [user, config, configLoading, isLoaded, fileLoading, loadFile])

  // Handle file selection from dropdown
  const handleSelectFile = useCallback(
    (doc: DocumentConfig) => {
      // If there are unsaved changes, confirm before switching
      if (hasChanges) {
        const confirmed = window.confirm('You have unsaved changes. Discard them and switch files?')
        if (!confirmed) {
          return
        }
      }

      // Reset editor state
      setContent('')
      setOriginalContent('')
      setFileSha('')
      setIsLoaded(false)
      setError(null)

      // Load the new file
      loadFile(doc.path)
    },
    [hasChanges, loadFile]
  )

  const handleSave = useCallback(async () => {
    if (!user || !selectedPath) {
      setError('Please log in and select a file to save')
      return
    }
    if (!fileSha) {
      setError('No file loaded')
      return
    }

    try {
      setError(null)
      setSaving(true)
      const newSha = await saveFile(selectedPath, content, fileSha, `Update ${selectedPath}`)
      setFileSha(newSha)
      setOriginalContent(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setSaving(false)
    }
  }, [user, selectedPath, content, fileSha])

  const handleReplace = useCallback(
    (search: string, replace: string, replaceAll: boolean) => {
      if (replaceAll) {
        setContent(content.split(search).join(replace))
      } else {
        const index = content.indexOf(search)
        if (index !== -1) {
          setContent(content.slice(0, index) + replace + content.slice(index + search.length))
        }
      }
    },
    [content]
  )

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={login} loading={authLoading} />
  }

  // Combine errors
  const displayError = error || configError

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-gray-100">
          <div className="text-gray-600">Loading editor...</div>
        </div>
      }
    >
      <div className="h-screen flex flex-col">
        <MenuBar
          documents={config?.documents || []}
          selectedPath={selectedPath}
          onSelectFile={handleSelectFile}
          isLoaded={isLoaded}
          onSave={handleSave}
          onSearchReplace={() => setIsSearchOpen(true)}
          hasChanges={hasChanges}
          saving={saving}
          user={user}
          onLogin={login}
          onLogout={logout}
          configLoading={configLoading}
        />

        {displayError && (
          <div className="bg-red-100 border-b border-red-300 text-red-700 px-4 py-2 text-sm">Error: {displayError}</div>
        )}

        {fileLoading && (
          <div className="bg-blue-100 border-b border-blue-300 text-blue-700 px-4 py-2 text-sm">Loading file...</div>
        )}

        <Editor content={content} onChange={setContent} disabled={!isLoaded || fileLoading} />

        <SearchReplace isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onReplace={handleReplace} />

        <div className="bg-gray-200 px-4 py-1 text-sm text-gray-600 flex justify-between">
          <span>{isLoaded && selectedPath ? `Editing: ${selectedPath}` : 'Select a file from the Files menu'}</span>
          <span>
            Lines: {content.split('\n').length} | Characters: {content.length}
          </span>
        </div>
      </div>
    </Suspense>
  )
}

export default App
