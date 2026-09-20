import { HttpError } from '@cognite/sdk';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300;

function isRateLimited(error: unknown): error is HttpError {
  return error instanceof HttpError && error.status === 429;
}

function retryAfterMs(error: HttpError): number | null {
  const header = error.headers['retry-after'] ?? error.headers['Retry-After'];
  if (!header) return null;
  const seconds = Number(header);
  return Number.isNaN(seconds) ? null : seconds * 1000;
}

function backoffDelayMs(attempt: number): number {
  const exponential = BASE_DELAY_MS * 2 ** attempt;
  const jitter = Math.random() * BASE_DELAY_MS;
  return exponential + jitter;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries a CDF call with exponential backoff + jitter on 429 responses,
 * honoring `Retry-After` when the API provides it. Bounded at MAX_RETRIES —
 * every CDF-calling panel goes through this via useAsyncPanelData, so this
 * one place covers the concurrency/rate-limit exposure across the app.
 */
export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isRateLimited(error) || attempt >= maxRetries) throw error;
      await wait(retryAfterMs(error) ?? backoffDelayMs(attempt));
    }
  }
}
