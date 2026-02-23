import React from 'react';
import { notifyError, notifySuccess } from '../lib/notify';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  stack?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      stack: undefined,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unknown rendering error',
      stack: error.stack,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleCopyError = async (): Promise<void> => {
    const payload = [
      `message: ${this.state.errorMessage}`,
      `stack: ${this.state.stack ?? 'not available'}`,
      `time: ${new Date().toISOString()}`,
      `userAgent: ${navigator.userAgent}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(payload);
      notifySuccess('Error details copied');
    } catch (error) {
      notifyError('Could not copy error details', error);
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="min-h-screen p-8 flex items-center justify-center"
        style={{ backgroundColor: '#0F172A' }}
      >
        <div
          className="max-w-xl w-full rounded-2xl p-8 border"
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
          }}
        >
          <h1
            className="mb-3"
            style={{
              color: '#FFFFFF',
              fontSize: 28,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Something went wrong
          </h1>
          <p className="mb-6" style={{ color: '#CBD5E1' }}>
            The app hit an unexpected UI error. You can reload and continue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
                color: '#0F172A',
              }}
            >
              Reload App
            </button>
            <button
              onClick={() => void this.handleCopyError()}
              className="px-5 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 cursor-pointer"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#EF4444',
              }}
            >
              Copy Error Details
            </button>
          </div>
        </div>
      </div>
    );
  }
}

