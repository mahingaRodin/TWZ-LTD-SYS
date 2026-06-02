import { ERROR_CODES, HTTP_STATUS } from '@fire-system/shared-constants';

/**
 * Application error carrying an HTTP status and a machine-readable code.
 * Thrown anywhere in a request lifecycle and translated to an API error
 * envelope by the central error-handling middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static unauthorized(message = 'Unauthorized', code: string = ERROR_CODES.UNAUTHORIZED): AppError {
    return new AppError(HTTP_STATUS.UNAUTHORIZED, code, message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message: string): AppError {
    return new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR, message);
  }
}
