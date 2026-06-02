import bcrypt from 'bcryptjs';
import { AUTH } from '@fire-system/shared-constants';

/** Hash a plaintext password with bcrypt. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, AUTH.BCRYPT_SALT_ROUNDS);
}

/** Compare a plaintext password against a stored bcrypt hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
