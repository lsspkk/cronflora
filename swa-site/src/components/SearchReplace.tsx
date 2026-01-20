import { useState, useEffect, useRef } from 'react'

interface SearchReplaceProps {
  isOpen: boolean
  onClose: () => void
  onReplace: (search: string, replace: string, replaceAll: boolean) => void
  onFind?: (search: string, direction: 'next' | 'prev') => void
  isDark?: boolean
}

export function SearchReplace({ isOpen, onClose, onReplace, onFind, isDark }: SearchReplaceProps) {
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFind = () => {
    if (search && onFind) {
      onFind(search, 'next')
    }
  }

  const handlePrev = () => {
    if (search && onFind) {
      onFind(search, 'prev')
    }
  }

  const handleNext = () => {
    if (search && onFind) {
      onFind(search, 'next')
    }
  }

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

  return (
    <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-b px-3 py-2`}>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          ref={searchInputRef}
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                handlePrev()
              } else {
                handleNext()
              }
            }
          }}
          className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-[120px] ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder='Find...'
        />
        <input
          type='text'
          value={replace}
          onChange={(e) => setReplace(e.target.value)}
          className={`px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-[120px] ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
          placeholder='Replace...'
        />
        <button
          onClick={handlePrev}
          disabled={!search}
          className={`px-1.5 py-1 text-sm rounded hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
          }`}
          title='Previous (Shift+Enter)'
        >
          ▲
        </button>
        <button
          onClick={handleNext}
          disabled={!search}
          className={`px-1.5 py-1 text-sm rounded hover:bg-opacity-80 disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
          }`}
          title='Next (Enter)'
        >
          ▼
        </button>
        <button
          onClick={handleFind}
          disabled={!search}
          className='px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Find
        </button>
        <button
          onClick={handleReplace}
          disabled={!search}
          className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          Replace
        </button>
        <button
          onClick={handleReplaceAll}
          disabled={!search}
          className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          All
        </button>
        <button
          onClick={onClose}
          className={`px-2 py-1 text-sm rounded ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
          title='Close search'
        >
          ✕
        </button>
      </div>
    </div>
  )
}
