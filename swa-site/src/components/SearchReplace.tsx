import { useState } from 'react'

interface SearchReplaceProps {
  isOpen: boolean
  onClose: () => void
  onReplace: (search: string, replace: string, replaceAll: boolean) => void
}

export function SearchReplace({ isOpen, onClose, onReplace }: SearchReplaceProps) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')

  if (!isOpen) return null

  const handleReplace = () => {
    if (search) {
      onReplace(search, replace, false)
    }
  }

  const handleReplaceAll = () => {
    if (search) {
      onReplace(search, replace, true)
    }
  }

  const handleClose = () => {
    setSearch('')
    setReplace('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl p-4 w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Search & Replace</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Text to find..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Replace with
            </label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Replacement text..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleReplace}
              disabled={!search}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={!search}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
