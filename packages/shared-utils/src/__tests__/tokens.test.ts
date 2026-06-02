import { generateOpaqueToken, generateOtp, sha256 } from '../tokens';

describe('tokens', () => {
  it('generates an OTP of the requested length', () => {
    const otp = generateOtp(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('generates distinct opaque tokens', () => {
    expect(generateOpaqueToken()).not.toBe(generateOpaqueToken());
  });

  it('sha256 is deterministic and fixed-width', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).toHaveLength(64);
    expect(sha256('abc')).not.toBe(sha256('abd'));
  });
});
