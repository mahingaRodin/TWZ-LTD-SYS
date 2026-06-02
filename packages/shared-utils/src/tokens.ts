import crypto from 'crypto';
import { AUTH } from '@fire-system/shared-constants';

/** Generate a numeric OTP code of the configured length (zero-padded). */
export function generateOtp(length: number = AUTH.OTP_LENGTH): string {
  const max = 10 ** length;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(length, '0');
}

/** Generate a cryptographically random, URL-safe opaque token (e.g. refresh token). */
export function generateOpaqueToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

/** Deterministic SHA-256 hash, used to store refresh/OTP tokens without keeping the plaintext. */
export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
