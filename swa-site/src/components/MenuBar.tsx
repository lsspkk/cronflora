import { DocumentConfig } from '../types'
import { FileDropdown } from './FileDropdown'
import { DarkModeIcon } from './DarkModeIcon'

interface MenuBarProps {
  documents: DocumentConfig[]
  selectedPath: string | null
  onSelectFile: (doc: DocumentConfig) => void
  isLoaded: boolean
  onSave: () => void
  onSearchReplace: () => void
  hasChanges: boolean
  saving: boolean
  user: { userDetails: string } | null
  onLogin: () => void
  onLogout: () => void
  configLoading: boolean
  isDark: boolean
  onToggleDark: () => void
}

export function MenuBar({
  documents,
  selectedPath,
  onSelectFile,
  isLoaded,
  onSave,
  onSearchReplace,
  hasChanges,
  saving,
  user,
  onLogin,
  onLogout,
  configLoading,
  isDark,
  onToggleDark,
}: MenuBarProps) {
  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-800'} text-white px-3 py-1.5 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        <img src="/vite.svg" alt="CronFlora" className="w-5 h-5" />

        <div className="flex items-center gap-1">
          <FileDropdown
            documents={documents}
            selectedPath={selectedPath}
            onSelect={onSelectFile}
            disabled={!user || configLoading}
            isDark={isDark}
          />

          <button
            onClick={onSave}
            disabled={!isLoaded || !hasChanges || saving}
            className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : hasChanges ? 'Save *' : 'Save'}
          </button>

          <button
            onClick={onSearchReplace}
            disabled={!isLoaded}
            className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleDark}
          className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <DarkModeIcon isDark={isDark} className="w-5 h-5" />
        </button>

        {user ? (
          <>
            <span className="text-xs text-gray-400">{user.userDetails}</span>
            <button onClick={onLogout} className="px-2 py-0.5 bg-red-700 hover:bg-red-600 rounded text-xs">
              Logout
            </button>
          </>
        ) : (
          <button onClick={onLogin} className="px-2 py-0.5 bg-green-700 hover:bg-green-600 rounded text-xs">
            Login
          </button>
        )}
      </div>
    </div>
  )
}
