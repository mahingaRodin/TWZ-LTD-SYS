import type { JwtPayload } from '@fire-system/shared-types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by the auth middleware after a valid access token. */
      user?: JwtPayload;
    }
  }
}

export {};
