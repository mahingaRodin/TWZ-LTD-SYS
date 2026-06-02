import type { ApiError, ApiSuccess } from '@fire-system/shared-types';

/** Build a success envelope: { success: true, data, message? }. */
export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return message ? { success: true, data, message } : { success: true, data };
}

/** Build an error envelope: { success: false, error: { code, message, details? } }. */
export function fail(code: string, message: string, details?: unknown): ApiError {
  return { success: false, error: { code, message, details } };
}
