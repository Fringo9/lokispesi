import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: '' }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.setState({ errorInfo: errorInfo.componentStack ?? '' })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-dvh flex items-center justify-center bg-primary p-6">
          <div className="max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full bg-expense/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-expense" />
            </div>
            <h1 className="text-lg font-semibold text-text-primary mb-2">
              Qualcosa è andato storto
            </h1>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              Si è verificato un errore imprevisto. Puoi provare a ricaricare la pagina.
            </p>
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                  Dettagli tecnici
                </summary>
                <pre className="mt-2 text-[10px] text-text-tertiary bg-surface rounded-xl p-3 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.errorInfo}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              <RefreshCw size={16} /> Riprova
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
