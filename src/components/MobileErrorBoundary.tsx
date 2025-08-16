import React, { Component, ErrorInfo, ReactNode } from 'react';
import { mobileApi } from '../services/api';
import { mobileUtils } from '../services/native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
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
    
    // Report crash to backend for mobile analytics
    this.reportCrash(error, errorInfo);
  }

  private async reportCrash(error: Error, errorInfo: ErrorInfo) {
    try {
      const deviceInfo = mobileUtils.getDeviceInfo();
      
      await mobileApi.reportAppCrash({
        error: error.message,
        stack: error.stack,
        deviceInfo: {
          ...deviceInfo,
          errorInfo: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (reportError) {
      console.error('Failed to report crash:', reportError);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-6xl">😵</div>
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h1>
            <p className="text-muted-foreground max-w-md">
              We've encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MobileErrorBoundary; 