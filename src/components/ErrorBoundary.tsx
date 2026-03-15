import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw } from "lucide-react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI crash", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="saas-card w-full max-w-lg text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            StreamInfo
          </div>
          <h1 className="mt-3 text-xl font-semibold text-foreground">Что-то пошло не так</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Страница не загрузилась. Обновите окно или вернитесь чуть позже — мы уже разбираемся.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_14px_34px_hsl(var(--primary)_/_0.35)] transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <RefreshCw size={14} />
            Обновить
          </button>
        </div>
      </main>
    );
  }
}
