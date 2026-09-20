import { HttpError } from '@cognite/sdk';

export function isAccessDeniedError(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}
