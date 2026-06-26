import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export function RetryState({ message = "Couldn't reach the server.", onRetry, isRetrying = false }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[280px] p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-center max-w-md mx-auto my-6 shadow-xl">
      <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-400 mb-3.5">
        <WifiOff className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-slate-200 tracking-wide mb-1.5">
        Connection Interrupted
      </h4>
      <p className="text-xs text-slate-400 mb-5 max-w-xs leading-normal">
        {message} Please verify your network status or try fetching the records again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry Connection'}
        </button>
      )}
    </div>
  );
}
