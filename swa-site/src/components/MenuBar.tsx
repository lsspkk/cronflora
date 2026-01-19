interface MenuBarProps {
  documentPath: string
  isLoaded: boolean
  onLoad: () => void
  onSave: () => void
  onSearchReplace: () => void
  hasChanges: boolean
  saving: boolean
  user: { userDetails: string } | null
  onLogin: () => void
  onLogout: () => void
}

export function MenuBar({ documentPath, isLoaded, onLoad, onSave, onSearchReplace, hasChanges, saving, user, onLogin, onLogout }: MenuBarProps) {
  return (
    <div className='bg-gray-800 text-white px-4 py-2 flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <img src="/vite.svg" alt="CronFlora" className="w-6 h-6" />

        <div className='flex items-center gap-2'>
          <button
            onClick={onLoad}
            disabled={!user}
            className='px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Load
          </button>

          <button
            onClick={onSave}
            disabled={!isLoaded || !hasChanges || saving}
            className='px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {saving ? 'Saving...' : hasChanges ? 'Save *' : 'Save'}
          </button>

          <button
            onClick={onSearchReplace}
            disabled={!isLoaded}
            className='px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Search/Replace
          </button>
        </div>

        {isLoaded && <span className='text-gray-400 text-sm'>{documentPath}</span>}
      </div>

      <div className='flex items-center gap-3'>
        {user ? (
          <>
            <span className='text-sm text-gray-300'>{user.userDetails}</span>
            <button onClick={onLogout} className='px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm'>
              Logout
            </button>
          </>
        ) : (
          <button onClick={onLogin} className='px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm'>
            Login with GitHub
          </button>
        )}
      </div>
    </div>
  )
}
