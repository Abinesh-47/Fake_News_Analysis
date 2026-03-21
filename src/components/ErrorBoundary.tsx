import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
            <span className="text-red-500 text-2xl font-bold">!</span>
          </div>
          <h1 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-4">Neural Interface Failure</h1>
          <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed uppercase tracking-wider">
            A critical synchronization error occurred in the analysis engine. Technical data: {this.state.error?.message || "Unknown Exception"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-[0.3em] rounded-xl transition-all shadow-2xl shadow-blue-500/20"
          >
            Re-Initialize System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
