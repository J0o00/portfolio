import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary Intercepted]:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  reloadWindow = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[350px] p-8 rounded-2xl bg-slate-900/80 border border-red-500/30 backdrop-blur-md text-center max-w-lg mx-auto my-8 shadow-2xl">
          <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4 animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 tracking-wide mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-md">
            An unexpected error occurred while rendering this module. You can attempt to reload the component or refresh your workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.resetError}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              Try Again
            </button>
            <button
              onClick={this.reloadWindow}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/20 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Window
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
