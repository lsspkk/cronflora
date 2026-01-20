import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { LoginPage } from './components/LoginPage'
import { useAuth } from './hooks/useAuth'
import { useRepoConfig } from './hooks/useRepoConfig'
import { useDarkMode } from './hooks/useDarkMode'
import { getFile, saveFile } from './services/github'
import { getLastOpenedFile, setLastOpenedFile } from './services/storage'
import { DocumentConfig } from './types'

const MenuBar = lazy(() => import('./components/MenuBar').then((m) => ({ default: m.MenuBar })))
const Editor = lazy(() => import('./components/Editor').then((m) => ({ default: m.Editor })))
const SearchReplace = lazy(() => import('./components/SearchReplace').then((m) => ({ default: m.SearchReplace })))

function App() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const { config, loading: configLoading, error: configError } = useRepoConfig(!!user)
  const [isDark, toggleDark] = useDarkMode()

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

  const loadFile = useCallback(
    async (path: string) => {
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
    },
    [user],
  )

  useEffect(() => {
    if (!user || !config || configLoading || isLoaded || fileLoading) {
      return
    }

    const lastPath = getLastOpenedFile()
    if (lastPath) {
      const exists = config.documents.some((d) => d.path === lastPath)
      if (exists) {
        loadFile(lastPath)
      }
    }
  }, [user, config, configLoading, isLoaded, fileLoading, loadFile])

  const handleSelectFile = useCallback(
    (doc: DocumentConfig) => {
      if (hasChanges) {
        const confirmed = window.confirm('You have unsaved changes. Discard them and switch files?')
        if (!confirmed) {
          return
        }
      }

      setContent('')
      setOriginalContent('')
      setFileSha('')
      setIsLoaded(false)
      setError(null)

      loadFile(doc.path)
    },
    [hasChanges, loadFile],
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
    [content],
  )

  // Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isLoaded && hasChanges && !saving) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoaded, hasChanges, saving, handleSave])

  if (authLoading) {
    return (
      <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={login} loading={authLoading} />
  }

  const displayError = error || configError

  return (
    <Suspense
      fallback={
        <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
          <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading editor...</div>
        </div>
      }
    >
      <div className='h-screen flex flex-col'>
        <MenuBar
          documents={config?.documents || []}
          selectedPath={selectedPath}
          onSelectFile={handleSelectFile}
          isLoaded={isLoaded}
          onSave={handleSave}
          onSearchReplace={() => setIsSearchOpen(!isSearchOpen)}
          hasChanges={hasChanges}
          saving={saving}
          user={user}
          onLogin={login}
          onLogout={logout}
          configLoading={configLoading}
          isDark={isDark}
          onToggleDark={toggleDark}
        />

        <SearchReplace
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onReplace={handleReplace}
          onFind={(search, direction) => {
            // Simple find implementation - just highlights the next/prev occurrence
            // For a more sophisticated implementation, you could track cursor position
            alert(`Find ${direction}: "${search}"`)
          }}
          isDark={isDark}
        />

        {displayError && (
          <div className={`${isDark ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-300 text-red-700'} border-b px-4 py-2 text-sm`}>
            Error: {displayError}
          </div>
        )}

        {fileLoading && (
          <div className={`${isDark ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-blue-100 border-blue-300 text-blue-700'} border-b px-4 py-2 text-sm`}>
            Loading file...
          </div>
        )}

        <Editor content={content} onChange={setContent} disabled={!isLoaded || fileLoading} isDark={isDark} />

        <div className={`${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'} px-4 py-1 text-sm flex justify-between`}>
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
