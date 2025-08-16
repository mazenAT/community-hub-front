import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
    
    // Log detailed error information for debugging
    console.error('Error details:', {
      message: error.message || 'No error message',
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">😵</div>
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground">
              We've encountered an unexpected error. Please try reloading the app.
            </p>
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <p className="text-sm text-red-700 mb-1">
                  <strong>Message:</strong> {this.state.error.message || 'No message'}
                </p>
                <p className="text-sm text-red-700 mb-1">
                  <strong>Type:</strong> {this.state.error.name}
                </p>
                {this.state.errorInfo && (
                  <p className="text-sm text-red-700">
                    <strong>Component:</strong> {this.state.errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown'}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Reload App
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="block w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MobileErrorBoundary; 