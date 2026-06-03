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
  otpEmailHtml,
  passwordResetEmailHtml,
  sha256,
  signAccessToken,
  verifyPassword,
} from '@fire-system/shared-utils';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { sendEmail } from '../../utils/notifier';
import { userRepository } from '../../repositories/user.repository';
import { otpRepository } from '../../repositories/otp.repository';
import { refreshTokenRepository } from '../../repositories/refreshToken.repository';
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  RequestOtpDto,
  ResetPasswordDto,
  UpdateProfileDto,
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

/** Create an OTP, persist its hash, email it to the user, and return the code. */
async function createAndSendOtp(user: UserRecord, purpose: OtpPurpose): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + AUTH.OTP_TTL_MINUTES * 60 * 1000);
  await otpRepository.issue(user.id, sha256(code), purpose, expiresAt);

  const subject =
    purpose === OtpPurpose.EMAIL_VERIFICATION ? 'Verify your email' : 'Reset your password';
  const plain = `Hello ${user.firstName},\n\nYour ${AUTH.OTP_TTL_MINUTES}-minute code is: ${code}\n\nIf you did not request this, ignore this email.`;
  const html =
    purpose === OtpPurpose.EMAIL_VERIFICATION
      ? otpEmailHtml(user.firstName, code, AUTH.OTP_TTL_MINUTES)
      : passwordResetEmailHtml(user.firstName, code, AUTH.OTP_TTL_MINUTES);
  await sendEmail(user.email, subject, plain, html);
  logger.info(`OTP for ${purpose} issued`, { userId: user.id });
  return code;
}

export interface RegisterResult {
  user: PublicUser;
  message: string;
}

export interface OtpResult {
  message: string;
}

export const authService = {
  /**
   * Register a new account and send an email-verification OTP.
   * The user cannot log in until the email is verified.
   */
  async register(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const user = await userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash: await hashPassword(dto.password),
      // Self-service registration is always a plain USER.
      role: UserRole.USER,
    });

    await createAndSendOtp(user, OtpPurpose.EMAIL_VERIFICATION);
    return {
      user: toPublicUser(user),
      message: 'Account created. Check your email for a verification code.',
    };
  },

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await userRepository.findByEmail(dto.email);
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw AppError.unauthorized('Invalid email or password', ERROR_CODES.INVALID_CREDENTIALS);
    }
    if (!user.isActive) {
      throw AppError.unauthorized('Account is inactive', ERROR_CODES.ACCOUNT_INACTIVE);
    }
    if (!user.isVerified) {
      throw AppError.unauthorized(
        'Email not verified. Please verify your email before logging in.',
        ERROR_CODES.EMAIL_NOT_VERIFIED,
      );
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
      await createAndSendOtp(user, dto.purpose);
      return { message: 'If the account exists, a code has been sent' };
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

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    const updated = await userRepository.updateProfile(userId, dto);
    return toPublicUser(updated);
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
