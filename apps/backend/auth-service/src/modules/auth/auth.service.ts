import {
  AuthResult,
  AuthTokens,
  OtpPurpose,
  PublicUser,
  UserRecord,
  UserRole,
} from '@fire-system/shared-types';
import { AUTH, ERROR_CODES } from '@fire-system/shared-constants';
import {
  AppError,
  generateOpaqueToken,
  generateOtp,
  hashPassword,
  sha256,
  signAccessToken,
  verifyPassword,
} from '@fire-system/shared-utils';
import { env, isProduction } from '../../config/env';
import { logger } from '../../utils/logger';
import { userRepository } from '../../repositories/user.repository';
import { otpRepository } from '../../repositories/otp.repository';
import { refreshTokenRepository } from '../../repositories/refreshToken.repository';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  RequestOtpDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './auth.types';

function toPublicUser(user: UserRecord): PublicUser {
  // Strip the password hash before anything leaves the service layer.
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

async function issueTokens(user: UserRecord): Promise<AuthTokens> {
  const accessToken = signAccessToken(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    env.JWT_EXPIRY,
  );

  const refreshToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await refreshTokenRepository.store(user.id, sha256(refreshToken), expiresAt);

  return { accessToken, refreshToken };
}

/** Create an OTP for the user, persist its hash, and return the plaintext code. */
async function createOtp(userId: string, purpose: OtpPurpose): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + AUTH.OTP_TTL_MINUTES * 60 * 1000);
  await otpRepository.issue(userId, sha256(code), purpose, expiresAt);
  // A real deployment hands this to the notification-service. In dev we log it.
  logger.info(`OTP for ${purpose} issued`, { userId });
  return code;
}

/** Include the OTP in API responses outside production so flows are testable. */
function exposeOtp(code: string): string | undefined {
  return isProduction ? undefined : code;
}

export interface RegisterResult extends AuthResult {
  devOtp?: string;
}

export interface OtpResult {
  message: string;
  devOtp?: string;
}

export const authService = {
  async register(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const user = await userRepository.create({
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      fullName: dto.fullName,
      phone: dto.phone,
      role: dto.role ?? UserRole.CUSTOMER,
    });

    const otp = await createOtp(user.id, OtpPurpose.EMAIL_VERIFICATION);
    const tokens = await issueTokens(user);

    return { user: toPublicUser(user), tokens, devOtp: exposeOtp(otp) };
  },

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw AppError.unauthorized('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }
    if (!user.isActive) {
      throw AppError.unauthorized('Account is inactive', ERROR_CODES.ACCOUNT_INACTIVE);
    }

    const tokens = await issueTokens(user);
    return { user: toPublicUser(user), tokens };
  },

  /** Rotate a refresh token: revoke the presented one and issue a fresh pair. */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    const hash = sha256(refreshToken);
    const stored = await refreshTokenRepository.findActiveByHash(hash);
    if (!stored) {
      throw AppError.unauthorized('Invalid or expired refresh token', ERROR_CODES.INVALID_TOKEN);
    }

    const user = await userRepository.findById(stored.user_id);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account is inactive', ERROR_CODES.ACCOUNT_INACTIVE);
    }

    await refreshTokenRepository.revoke(hash);
    return issueTokens(user);
  },

  async logout(refreshToken: string): Promise<void> {
    await refreshTokenRepository.revoke(sha256(refreshToken));
  },

  async requestOtp(dto: RequestOtpDto): Promise<OtpResult> {
    const user = await userRepository.findByEmail(dto.email);
    // Do not reveal whether the email exists — respond identically either way.
    if (user) {
      const code = await createOtp(user.id, dto.purpose);
      return { message: 'If the account exists, a code has been sent', devOtp: exposeOtp(code) };
    }
    return { message: 'If the account exists, a code has been sent' };
  },

  async verifyOtp(dto: VerifyOtpDto): Promise<{ verified: true }> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError(400, ERROR_CODES.OTP_INVALID, 'Invalid code');
    }
    await this.consumeOtp(user.id, dto.code, dto.purpose);

    if (dto.purpose === OtpPurpose.EMAIL_VERIFICATION) {
      await userRepository.markVerified(user.id);
    }
    return { verified: true };
  },

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError(400, ERROR_CODES.OTP_INVALID, 'Invalid code');
    }
    await this.consumeOtp(user.id, dto.code, OtpPurpose.PASSWORD_RESET);
    await userRepository.updatePassword(user.id, await hashPassword(dto.newPassword));
    // Force re-login everywhere after a password reset.
    await refreshTokenRepository.revokeAllForUser(user.id);
  },

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw AppError.unauthorized('Current password is incorrect', ERROR_CODES.INVALID_CREDENTIALS);
    }
    await userRepository.updatePassword(userId, await hashPassword(dto.newPassword));
    await refreshTokenRepository.revokeAllForUser(userId);
  },

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return toPublicUser(user);
  },

  /** Validate and consume an OTP, or throw a 400 with the appropriate code. */
  async consumeOtp(userId: string, code: string, purpose: OtpPurpose): Promise<void> {
    const otp = await otpRepository.findActive(userId, purpose);
    if (!otp) {
      throw new AppError(400, ERROR_CODES.OTP_EXPIRED, 'Code is invalid or has expired');
    }
    if (otp.code_hash !== sha256(code)) {
      throw new AppError(400, ERROR_CODES.OTP_INVALID, 'Invalid code');
    }
    await otpRepository.consume(otp.id);
  },
};
