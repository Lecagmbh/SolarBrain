import React from 'react';
import { DebugLogger } from './logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

function isChunkLoadError(error: Error): boolean {
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("Importing a module script failed")
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    isChunkError: false,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      isChunkError: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    DebugLogger.error('Uncaught React error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });

    // Chunk-Loading-Fehler: automatisch 1x neu laden
    if (isChunkLoadError(error)) {
      const lastReload = sessionStorage.getItem("chunk-error-reload");
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem("chunk-error-reload", String(now));
        window.location.reload();
        return;
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="text-4xl mb-4">
              {this.state.isChunkError ? "\u26A0\uFE0F" : "\u274C"}
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {this.state.isChunkError
                ? "Update verfügbar"
                : "Es ist ein Fehler aufgetreten"}
            </h2>
            <p className="text-zinc-400 mb-6 text-sm">
              {this.state.isChunkError
                ? "Eine neue Version wurde bereitgestellt. Bitte laden Sie die Seite neu."
                : "Ein unerwarteter Fehler ist aufgetreten. Der Fehler wurde protokolliert."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Seite neu laden
              </button>
              {!this.state.isChunkError && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Erneut versuchen
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
