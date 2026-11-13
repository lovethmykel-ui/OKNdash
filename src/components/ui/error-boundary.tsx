'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
  className?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable React Error Boundary that isolates rendering or async boundary
 * failures within a dashboard card or page section and provides one-click
 * recovery without tearing down the surrounding navigation shell.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ErrorBoundary] Caught component error:', error.message, errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className={cn(
            'rounded-[24px] border border-[#EF4444]/30 bg-[var(--s1)] p-6 text-center shadow-sm',
            this.props.className,
          )}
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#EF4444]/12 text-[#EF4444]">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="mt-3 text-base font-extrabold text-[var(--tx)]">
            {this.props.fallbackTitle ?? 'Something went wrong in this section'}
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-[var(--mut)]">
            {this.state.error?.message ||
              this.props.fallbackDescription ||
              'An unexpected error occurred while rendering. Your account data and balances are safe.'}
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#7A12F5] px-4 text-xs font-extrabold text-white shadow-sm hover:bg-[#8C38F7] active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>Try again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
