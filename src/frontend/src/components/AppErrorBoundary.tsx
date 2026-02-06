import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

interface AppErrorBoundaryProps {
  children: ReactNode;
  onRefresh: () => void;
  onClearCacheAndRefresh: () => Promise<void>;
  resetKey?: string | number;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isClearing: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isClearing: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: AppErrorBoundaryProps) {
    // Reset error state when resetKey changes
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
        isClearing: false,
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRefresh();
  };

  handleClearCacheAndRetry = async () => {
    this.setState({ isClearing: true });
    try {
      await this.props.onClearCacheAndRefresh();
      this.setState({ hasError: false, error: null, isClearing: false });
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.setState({ isClearing: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-8">
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Rendering Error</AlertTitle>
                <AlertDescription>
                  An unexpected error occurred while displaying the content. This might be due to corrupted data or a temporary issue.
                </AlertDescription>
              </Alert>

              {this.state.error && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <p className="font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={this.handleRetry}
                  variant="default"
                  disabled={this.state.isClearing}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button
                  onClick={this.handleClearCacheAndRetry}
                  variant="outline"
                  disabled={this.state.isClearing}
                >
                  <Trash2 className={`mr-2 h-4 w-4 ${this.state.isClearing ? 'animate-spin' : ''}`} />
                  Clear cache & retry
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                If the problem persists, try refreshing the page or clearing your browser cache.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
