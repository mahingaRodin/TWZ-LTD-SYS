import { UserRole } from '@fire-system/shared-types';
import { ERROR_CODES } from '@fire-system/shared-constants';
import { signAccessToken, verifyAccessToken } from '../jwt';
import { AppError } from '../errors';

const SECRET = 'unit-test-secret';
const payload = { sub: 'user-1', email: 'a@b.com', role: UserRole.ADMIN };

describe('jwt', () => {
  it('signs and verifies a token round-trip', () => {
    const token = signAccessToken(payload, SECRET, '5m');
    const decoded = verifyAccessToken(token, SECRET);
    expect(decoded).toEqual(payload);
  });

  it('rejects a token signed with a different secret', () => {
    const token = signAccessToken(payload, SECRET, '5m');
    try {
      verifyAccessToken(token, 'other-secret');
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).code).toBe(ERROR_CODES.INVALID_TOKEN);
    }
  });

  it('reports an expired token with the TOKEN_EXPIRED code', () => {
    const token = signAccessToken(payload, SECRET, '-1s');
    try {
      verifyAccessToken(token, SECRET);
      throw new Error('should have thrown');
    } catch (err) {
      expect((err as AppError).code).toBe(ERROR_CODES.TOKEN_EXPIRED);
    }
  });
});
