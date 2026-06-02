import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES, HTTP_STATUS } from '@fire-system/shared-constants';
import { AppError, fail } from '@fire-system/shared-utils';
import { logger } from '../utils/logger';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(fail(ERROR_CODES.NOT_FOUND, `Route not found: ${req.method} ${req.path}`));
}

/** Central error handler — converts thrown errors into the API error envelope. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res
      .status(HTTP_STATUS.BAD_REQUEST)
      .json(fail(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', err.flatten().fieldErrors));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message, err.details));
    return;
  }

  logger.error('Unhandled error', { error: err instanceof Error ? err.stack : err });
  res
    .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    .json(fail(ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
}
