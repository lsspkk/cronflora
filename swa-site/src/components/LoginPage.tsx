import { useState } from 'react'

/**
 * Minimal Login Page - Optimized for bandwidth conservation
 */

interface LoginPageProps {
  onLogin: () => void
  loading?: boolean
}

export function LoginPage({ onLogin, loading = false }: LoginPageProps) {
  const [apiResult, setApiResult] = useState<string | null>(null)
  const [apiLoading, setApiLoading] = useState(false)

  const testMessageApi = async () => {
    setApiLoading(true)
    setApiResult(null)
    try {
      const response = await fetch('/api/message')
      const data = await response.json()
      setApiResult(`GET /api/message\n\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setApiResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setApiLoading(false)
    }
  }

  const testHelloApi = async () => {
    setApiLoading(true)
    setApiResult(null)
    try {
      const response = await fetch('/api/hello?name=Cronflora')
      const data = await response.json()
      setApiResult(`GET /api/hello?name=Cronflora\n\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setApiResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        margin: 0,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px 32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#1a202c',
            marginBottom: '12px',
            marginTop: 0,
          }}
        >
          Cronflora
        </h1>

        <button
          onClick={onLogin}
          disabled={loading}
          style={{
            background: loading ? '#4a5568' : '#2d3748',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'all 0.2s',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#1a202c'
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = loading ? '#4a5568' : '#2d3748'
          }}
        >
          {loading ? 'Connecting...' : 'Sign in with GitHub'}
        </button>

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={testMessageApi}
            disabled={apiLoading}
            style={{
              background: apiLoading ? '#38a169' : '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: apiLoading ? 'not-allowed' : 'pointer',
              flex: 1,
              transition: 'all 0.2s',
              opacity: apiLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!apiLoading) {
                e.currentTarget.style.background = '#38a169'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = apiLoading ? '#38a169' : '#48bb78'
            }}
          >
            Test /api/message
          </button>

          <button
            onClick={testHelloApi}
            disabled={apiLoading}
            style={{
              background: apiLoading ? '#3182ce' : '#4299e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: apiLoading ? 'not-allowed' : 'pointer',
              flex: 1,
              transition: 'all 0.2s',
              opacity: apiLoading ? 0.6 : 1,
            }}
            onMouseOver={(e) => {
              if (!apiLoading) {
                e.currentTarget.style.background = '#3182ce'
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = apiLoading ? '#3182ce' : '#4299e1'
            }}
          >
            Test /api/hello
          </button>
        </div>

        {apiResult && (
          <pre
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f7fafc',
              borderRadius: '8px',
              fontSize: '12px',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '150px',
            }}
          >
            {apiResult}
          </pre>
        )}
      </div>
    </div>
  )
}
