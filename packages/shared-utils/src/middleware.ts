import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ERROR_CODES, HTTP_STATUS, PAGINATION } from '@fire-system/shared-constants';
import type { JwtPayload, Paginated, UserRole } from '@fire-system/shared-types';
import { AppError } from './errors';
import { fail } from './response';
import { verifyAccessToken } from './jwt';
import type { Logger } from './logger';

// Make the authenticated user available on every Express request, repo-wide.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ----------------------------------------------------------------------------
// Async wrapper
// ----------------------------------------------------------------------------

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wrap an async route so rejected promises are forwarded to the error middleware. */
export function asyncHandler(fn: AsyncRoute): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

// ----------------------------------------------------------------------------
// Authentication & authorization
// ----------------------------------------------------------------------------

/**
 * Build auth middleware bound to a JWT secret. Returned as a factory so each
 * service supplies its own secret (read from its validated env config).
 */
export function createAuth(getSecret: () => string) {
  /** Require a valid Bearer access token; attaches the payload to req.user. */
  const authenticate: RequestHandler = (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }
    req.user = verifyAccessToken(header.slice('Bearer '.length).trim(), getSecret());
    next();
  };

  /** Require the authenticated user to hold one of the given roles. */
  const authorize =
    (...roles: UserRole[]): RequestHandler =>
    (req, _res, next) => {
      if (!req.user) throw AppError.unauthorized();
      if (!roles.includes(req.user.role)) throw AppError.forbidden('Insufficient permissions');
      next();
    };

  return { authenticate, authorize };
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

/**
 * Validate & coerce `req.body` against a Zod schema; replaces body with the
 * parsed result. Accepts any schema (objects, `.refine()`d effects, etc.).
 */
export function validateBody<T extends ZodTypeAny>(schema: T): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data as z.infer<T>;
    next();
  };
}

// ----------------------------------------------------------------------------
// Pagination helpers
// ----------------------------------------------------------------------------

/** Parse `?page=&pageSize=` query params, clamped to sane bounds. */
export function parsePagination(query: Request['query']): {
  page: number;
  pageSize: number;
  offset: number;
} {
  const rawPage = Number(query.page);
  const rawSize = Number(query.pageSize);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : PAGINATION.DEFAULT_PAGE;
  const pageSize =
    Number.isFinite(rawSize) && rawSize > 0
      ? Math.min(Math.floor(rawSize), PAGINATION.MAX_PAGE_SIZE)
      : PAGINATION.DEFAULT_PAGE_SIZE;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

/** Assemble a paginated envelope from a page of items and the total count. */
export function buildPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// ----------------------------------------------------------------------------
// Logging, security, rate limiting
// ----------------------------------------------------------------------------

/** Log one line per completed request (method, path, status, duration). */
export function requestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
    next();
  };
}

/** Baseline security headers (Helmet). */
export function securityHeaders(): RequestHandler {
  return helmet();
}

/** Build a rate limiter. Defaults to 100 requests / 15 min per IP. */
export function createRateLimiter(options?: { windowMs?: number; max?: number }): RequestHandler {
  // Don't throttle during automated tests (they fire many requests in a burst).
  if (process.env.NODE_ENV === 'test') {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs: options?.windowMs ?? 15 * 60 * 1000,
    max: options?.max ?? 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json(fail(ERROR_CODES.RATE_LIMITED, 'Too many requests, please try again later'));
    },
  });
}

// ----------------------------------------------------------------------------
// Error handling (register these last)
// ----------------------------------------------------------------------------

/** 404 handler for unmatched routes. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(fail(ERROR_CODES.NOT_FOUND, `Route not found: ${req.method} ${req.path}`));
};

/** Central error handler — converts thrown errors into the API error envelope. */
export function createErrorHandler(logger: Logger) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
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
  };
}
