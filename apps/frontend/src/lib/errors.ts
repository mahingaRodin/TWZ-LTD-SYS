import type { AxiosError } from 'axios';
import type { ApiError } from '@fire-system/shared-types';

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err === 'string') return err;
  const ax = err as AxiosError<ApiError>;
  if (ax.response?.data?.success === false) {
    return ax.response.data.error.message;
  }
  if (ax.message) return ax.message;
  if (err instanceof Error) return err.message;
  return fallback;
}
