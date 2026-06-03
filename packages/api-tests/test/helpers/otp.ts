import { OtpPurpose } from '@fire-system/shared-types';
import { AUTH } from '@fire-system/shared-constants';
import { generateOtp, sha256 } from '@fire-system/shared-utils';
import { otpRepository } from '../../../../apps/backend/auth-service/src/repositories/otp.repository';
import { userRepository } from '../../../../apps/backend/auth-service/src/repositories/user.repository';

export async function issueTestOtp(
  email: string,
  purpose: OtpPurpose = OtpPurpose.EMAIL_VERIFICATION,
): Promise<string> {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new Error(`Test user not found: ${email}`);
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + AUTH.OTP_TTL_MINUTES * 60 * 1000);
  await otpRepository.issue(user.id, sha256(code), purpose, expiresAt);
  return code;
}
