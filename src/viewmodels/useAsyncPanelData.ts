import { useCallback, useEffect, useState } from 'react';

import { isAccessDeniedError } from '../services/errors';
import { retryWithBackoff } from '../services/retryWithBackoff';

import type { PanelState } from './panelState';

export interface AsyncPanelData<T> {
  state: PanelState<T>;
  refetch: () => void;
}

interface DepsGeneration {
  deps: readonly unknown[];
  generation: number;
}

/**
 * Increments whenever `deps` shallowly changes. Uses React's "adjusting
 * state during render" pattern (conditional setState in the render body,
 * not in an effect and not via a ref) so the reset is available on the
 * very same render that saw the new deps.
 */
function useDepsGeneration(deps: readonly unknown[]): number {
  const [tracked, setTracked] = useState<DepsGeneration>(() => ({ deps, generation: 0 }));
  const changed =
    tracked.deps.length !== deps.length || deps.some((dep, index) => !Object.is(dep, tracked.deps[index]));
  if (changed) {
    setTracked({ deps, generation: tracked.generation + 1 });
  }
  return changed ? tracked.generation + 1 : tracked.generation;
}

/**
 * Storage layer for a single panel's async fetch: owns loading/success/error/
 * no-access state so panel view models can compose it with derivations and
 * side effects (like audit logging) without holding state themselves.
 */
export function useAsyncPanelData<T>(fetch: () => Promise<T>, deps: readonly unknown[]): AsyncPanelData<T> {
  const depsGeneration = useDepsGeneration(deps);
  const [attempt, setAttempt] = useState(0);
  const key = `${depsGeneration}:${attempt}`;

  const [state, setState] = useState<PanelState<T>>({ status: 'loading' });
  // Reset to loading when the fetch key changes — an "adjust state during
  // render" update (not inside an effect), which React allows and dedupes.
  const [trackedKey, setTrackedKey] = useState(key);
  if (key !== trackedKey) {
    setTrackedKey(key);
    setState({ status: 'loading' });
  }

  const refetch = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    // Every panel's fetch goes through this one hook, so bounded 429 backoff
    // lives here rather than being duplicated per service (criterion 2.5).
    retryWithBackoff(fetch)
      .then((data) => {
        if (!cancelled) setState({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isAccessDeniedError(error)) {
          setState({ status: 'no-access' });
        } else {
          setState({ status: 'error', message: error instanceof Error ? error.message : 'Something went wrong' });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fetch` intentionally excluded; `key` already captures every real dependency.
  }, [key]);

  return { state, refetch };
}
