import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { LoginPage } from './components/LoginPage'
import { useAuth } from './hooks/useAuth'
import { useConfig } from './hooks/useConfig'
import { getFile, saveFile } from './services/github'

// Lazy load heavy components only after authentication
// This significantly reduces initial bundle size and bandwidth usage
const MenuBar = lazy(() => import('./components/MenuBar').then((m) => ({ default: m.MenuBar })))
const Editor = lazy(() => import('./components/Editor').then((m) => ({ default: m.Editor })))
const SearchReplace = lazy(() => import('./components/SearchReplace').then((m) => ({ default: m.SearchReplace })))

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
      const file = await getFile(user.accessToken, config.githubOwner, config.githubRepo, config.documentPath, config.githubBranch)
      setContent(file.content)
      setOriginalContent(file.content)
      setFileSha(file.sha)
      setIsLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document')
    }
  }, [user, config])

  // Auto-load file when user logs in
  useEffect(() => {
    if (user?.accessToken && !isLoaded && !loading) {
      handleLoad()
    }
  }, [user?.accessToken, isLoaded, loading, handleLoad])

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
        `Update ${config.documentPath}`,
      )
      setFileSha(newSha)
      setOriginalContent(content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setSaving(false)
    }
  }, [user, config, content, fileSha])

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

  if (loading) {
    return (
      <div className='h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-gray-600'>Loading...</div>
      </div>
    )
  }

  // Show minimal login page if user is not authenticated
  // This keeps initial page load lightweight and bandwidth-friendly
  if (!user) {
    return <LoginPage onLogin={login} loading={loading} />
  }

  // Main editor interface - only loaded after authentication
  return (
    <Suspense
      fallback={
        <div className='h-screen flex items-center justify-center bg-gray-100'>
          <div className='text-gray-600'>Loading editor...</div>
        </div>
      }
    >
      <div className='h-screen flex flex-col'>
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

        {error && <div className='bg-red-100 border-b border-red-300 text-red-700 px-4 py-2 text-sm'>Error: {error}</div>}

        <Editor content={content} onChange={setContent} disabled={!isLoaded} />

        <SearchReplace isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onReplace={handleReplace} />

        <div className='bg-gray-200 px-4 py-1 text-sm text-gray-600 flex justify-between'>
          <span>{isLoaded ? `Editing: ${config.documentPath}` : 'No document loaded'}</span>
          <span>
            Lines: {content.split('\n').length} | Characters: {content.length}
          </span>
        </div>
      </div>
    </Suspense>
  )
}

export default App
