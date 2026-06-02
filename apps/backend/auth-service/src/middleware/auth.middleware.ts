import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@fire-system/shared-types';
import { AppError, verifyAccessToken } from '@fire-system/shared-utils';
import { env } from '../config/env';

/** Require a valid Bearer access token; attaches the decoded payload to req.user. */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or malformed Authorization header');
  }
  const token = header.slice('Bearer '.length).trim();
  req.user = verifyAccessToken(token, env.JWT_SECRET);
  next();
}

/** Require the authenticated user to hold one of the given roles. */
export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }
    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('Insufficient permissions');
    }
    next();
  };
}
