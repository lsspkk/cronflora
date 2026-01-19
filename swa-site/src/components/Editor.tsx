import { useRef, useEffect, useState, useCallback } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  disabled?: boolean
}

export function Editor({ content, onChange, disabled }: EditorProps) {
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
    <div className="flex-1 flex bg-gray-50 overflow-hidden">
      <div
        ref={lineNumbersRef}
        className="bg-gray-100 text-gray-500 text-sm font-mono py-3 overflow-hidden select-none border-r border-gray-300"
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
        className="flex-1 p-3 font-mono text-sm leading-6 resize-none focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500"
        style={{ lineHeight: '24px' }}
        placeholder={disabled ? 'Please load a document to edit...' : 'Start typing...'}
        spellCheck={false}
      />
    </div>
  )
}
