import { useState, useRef, useEffect } from 'react'
import { DocumentConfig } from '../types'

interface FileDropdownProps {
  documents: DocumentConfig[]
  selectedPath: string | null
  onSelect: (doc: DocumentConfig) => void
  disabled?: boolean
  isDark?: boolean
}

function getDisplayName(doc: DocumentConfig): string {
  if (doc.name) {
    return doc.name
  }
  const parts = doc.path.split('/')
  const filename = parts[parts.length - 1]
  return filename.replace(/\.[^/.]+$/, '')
}

export function FileDropdown({ documents, selectedPath, onSelect, disabled, isDark }: FileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSelect = (doc: DocumentConfig) => {
    onSelect(doc)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
      >
        Files
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-64 ${isDark ? 'bg-gray-900' : 'bg-gray-800'} border border-gray-600 rounded shadow-lg z-50`}>
          {documents.length === 0 ? (
            <div className="px-3 py-2 text-gray-400 text-sm">No files configured</div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.path}
                onClick={() => handleSelect(doc)}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-start gap-2"
              >
                <span className="flex-shrink-0 w-4 mt-0.5">
                  {selectedPath === doc.path && (
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{getDisplayName(doc)}</div>
                  <div className="text-xs text-gray-400 truncate">{doc.description}</div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
