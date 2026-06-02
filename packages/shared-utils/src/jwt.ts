import jwt, { SignOptions } from 'jsonwebtoken';
import { ERROR_CODES } from '@fire-system/shared-constants';
import type { JwtPayload } from '@fire-system/shared-types';
import { AppError } from './errors';

/** Sign a short-lived access token. `expiresIn` accepts ms strings ("15m") or seconds. */
export function signAccessToken(
  payload: JwtPayload,
  secret: string,
  expiresIn: string | number,
): string {
  return jwt.sign(payload, secret, { expiresIn } as SignOptions);
}

/**
 * Verify an access token and return its payload.
 * Throws an {@link AppError} (401) on an expired or otherwise invalid token.
 */
export function verifyAccessToken(token: string, secret: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & JwtPayload;
    return { sub: decoded.sub, email: decoded.email, role: decoded.role };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Token expired', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw AppError.unauthorized('Invalid token', ERROR_CODES.INVALID_TOKEN);
  }
}
