import { useRef, useEffect, useState, useCallback } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  disabled?: boolean
  isDark?: boolean
}

export function Editor({ content, onChange, disabled, isDark }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(1)

  const updateLineNumbers = useCallback(() => {
    const lines = content.split('\n').length
    setLineCount(lines)
  }, [content])

  useEffect(() => {
    updateLineNumbers()
  }, [updateLineNumbers])

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className={`flex-1 flex ${isDark ? 'bg-gray-900' : 'bg-gray-50'} overflow-hidden`}>
      <div
        ref={lineNumbersRef}
        className={`${isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-500 border-gray-300'} text-sm font-mono py-3 overflow-hidden select-none border-r`}
        style={{ minWidth: '4rem' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i + 1}
            className="px-3 text-right leading-6"
            style={{ height: '24px' }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onScroll={handleScroll}
        disabled={disabled}
        className={`flex-1 p-3 font-mono text-sm leading-6 resize-none focus:outline-none ${
          isDark
            ? 'bg-gray-900 text-gray-100 disabled:bg-gray-800 disabled:text-gray-500'
            : 'bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500'
        }`}
        style={{ lineHeight: '24px' }}
        placeholder={disabled ? 'Select a file from the Files menu...' : 'Start typing...'}
        spellCheck={false}
      />
    </div>
  )
}
