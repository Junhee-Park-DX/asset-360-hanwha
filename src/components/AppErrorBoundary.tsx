import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/**
 * FR-016: catches uncaught render errors in routing/shared layout and shows
 * a recovery affordance instead of a blank screen. This is deliberately
 * broader than a per-panel error state (FR-011) — those are async
 * fetch failures each panel handles itself; this is a last-resort net for
 * render-time exceptions anywhere in the routed content.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unrecoverable render error in Asset 360', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center p-8">
          <EmptyState variant="full" type="error-generic" role="alert">
            <EmptyStateIcon />
            <EmptyStateTitle>Something went wrong</EmptyStateTitle>
            <EmptyStateDescription>Reload the page to keep investigating.</EmptyStateDescription>
            <EmptyStateActions>
              <Button variant="default" onClick={() => window.location.reload()}>
                Reload
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </main>
      );
    }
    return this.props.children;
  }
}
