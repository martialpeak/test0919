import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DetailErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MovieDetail render error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-[#0D0D12] text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="max-w-md w-full bg-[#141420] border border-rose-500/30 rounded-3xl p-8 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-bold text-white">خطا در بارگذاری جزئیات اثر</h2>
            <p className="text-xs text-[#A0A0B5] leading-relaxed">
              {this.state.error?.message || 'متأسفانه در نمایش اطلاعات تکمیلی این فیلم خطایی رخ داد.'}
            </p>
            {this.state.error?.stack && (
              <pre className="text-[10px] text-left p-2 bg-black/50 text-rose-300 rounded overflow-auto max-h-32 text-xs" dir="ltr">
                {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold transition-all"
            >
              بازگشت به لیست فیلم‌ها
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
