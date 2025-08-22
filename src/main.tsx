import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { dbg } from '@/lib/debug'
import { applyModeFromUrl } from '@/lib/mode'

dbg.enableFromQuery()
applyModeFromUrl()

class RootErrorBoundary extends React.Component<{}, { hasError: boolean, message?: string }> {
  constructor(props: {}) {
    super(props)
    this.state = { hasError: false, message: undefined }
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: String(error?.message || error) }
  }
  componentDidCatch(error: any, info: any) {
    console.error('Erro no RootErrorBoundary:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div>
            <div className="text-xl mb-2">⚠️ Ocorreu um erro ao carregar a app.</div>
            <div className="text-sm text-gray-300">{this.state.message}</div>
          </div>
        </div>
      )
    }
    return this.props.children as any
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <StrictMode>
      <App />
    </StrictMode>
  </RootErrorBoundary>,
)


