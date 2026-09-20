import { HttpError } from '@cognite/sdk';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAsyncPanelData } from './useAsyncPanelData';

describe('useAsyncPanelData', () => {
  it('starts loading, then resolves to success', async () => {
    const fetch = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsyncPanelData(fetch, ['key']));

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'data' }));
  });

  it('surfaces a no-access state on a 403 without exhausting retries (not rate-limited)', async () => {
    const fetch = vi.fn(() => Promise.reject(new HttpError(403, { error: { code: 403, message: 'Forbidden' } }, {})));
    const { result } = renderHook(() => useAsyncPanelData(fetch, ['key']));

    await waitFor(() => expect(result.current.state).toEqual({ status: 'no-access' }));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('surfaces a generic error state for a non-HTTP failure', async () => {
    const fetch = vi.fn(() => Promise.reject(new Error('network down')));
    const { result } = renderHook(() => useAsyncPanelData(fetch, ['key']));

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error', message: 'network down' }));
  });

  it('resets to loading and re-fetches when deps change', async () => {
    const fetch = vi.fn(() => Promise.resolve('data'));
    const { result, rerender } = renderHook(({ dep }) => useAsyncPanelData(fetch, [dep]), { initialProps: { dep: 'a' } });
    await waitFor(() => expect(result.current.state.status).toBe('success'));

    rerender({ dep: 'b' });

    expect(result.current.state).toEqual({ status: 'loading' });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it('refetch re-triggers the fetch without a deps change', async () => {
    const fetch = vi.fn(() => Promise.resolve('data'));
    const { result } = renderHook(() => useAsyncPanelData(fetch, ['key']));
    await waitFor(() => expect(result.current.state.status).toBe('success'));

    act(() => result.current.refetch());

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
