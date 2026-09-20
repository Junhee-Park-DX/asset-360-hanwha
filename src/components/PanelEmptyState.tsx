import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Skeleton } from '@cognite/aura/components/skeleton';

interface PanelEmptyStateProps {
  kind: 'loading' | 'empty' | 'error' | 'no-access';
  emptyMessage: string;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * One reused empty-state pattern across the time series, work orders, and
 * documents panels (FR-011) — the analyst learns it once, not per panel.
 */
export function PanelEmptyState({ kind, emptyMessage, errorMessage, onRetry }: PanelEmptyStateProps) {
  if (kind === 'loading') {
    return (
      <div role="status" aria-live="polite" aria-label="Loading" className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }
  if (kind === 'no-access') {
    return (
      <EmptyState variant="compact" type="no-access" role="status" className="mx-auto p-4">
        <EmptyStateIcon />
        <EmptyStateTitle>No access</EmptyStateTitle>
        <EmptyStateDescription>You don&apos;t have access to this data.</EmptyStateDescription>
      </EmptyState>
    );
  }
  if (kind === 'error') {
    return (
      <EmptyState variant="compact" type="error-generic" role="alert" className="mx-auto p-4">
        <EmptyStateIcon />
        <EmptyStateTitle>Something went wrong</EmptyStateTitle>
        <EmptyStateDescription>{errorMessage ?? 'Something went wrong.'}</EmptyStateDescription>
        {onRetry ? (
          <EmptyStateActions>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </EmptyStateActions>
        ) : null}
      </EmptyState>
    );
  }
  return (
    <EmptyState variant="compact" type="no-results" role="status" className="mx-auto p-4">
      <EmptyStateIcon />
      <EmptyStateDescription>{emptyMessage}</EmptyStateDescription>
    </EmptyState>
  );
}
