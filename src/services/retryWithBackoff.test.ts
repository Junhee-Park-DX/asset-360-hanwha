import { HttpError } from '@cognite/sdk';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { retryWithBackoff } from './retryWithBackoff';

function rateLimitError(headers: Record<string, string> = {}): HttpError {
  return new HttpError(429, { error: { code: 429, message: 'Too Many Requests' } }, headers);
}

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result immediately when the call succeeds', async () => {
    const fn = vi.fn(() => Promise.resolve('ok'));

    await expect(retryWithBackoff(fn)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on a 429 with exponential backoff and eventually succeeds', async () => {
    const fn = vi.fn().mockRejectedValueOnce(rateLimitError()).mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('honors a Retry-After header instead of the default backoff', async () => {
    const fn = vi.fn().mockRejectedValueOnce(rateLimitError({ 'retry-after': '5' })).mockResolvedValueOnce('ok');

    const promise = retryWithBackoff(fn);
    await vi.advanceTimersByTimeAsync(4999);
    expect(fn).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toBe('ok');
  });

  it('gives up after the retry limit and rethrows the last error', async () => {
    const fn = vi.fn(() => Promise.reject(rateLimitError()));

    const promise = retryWithBackoff(fn, 2);
    const assertion = expect(promise).rejects.toBeInstanceOf(HttpError);
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3); // initial attempt + 2 retries
  });

  it('does not retry non-429 errors', async () => {
    const fn = vi.fn(() => Promise.reject(new Error('network down')));

    await expect(retryWithBackoff(fn)).rejects.toThrow('network down');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
