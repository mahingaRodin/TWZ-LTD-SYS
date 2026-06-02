import { z } from 'zod';
import { OtpPurpose, UserRole } from '@fire-system/shared-types';
import { AUTH } from '@fire-system/shared-constants';

const password = z.string().min(AUTH.MIN_PASSWORD_LENGTH, {
  message: `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters`,
});

export const registerSchema = z.object({
  email: z.string().email(),
  password,
  fullName: z.string().min(1).max(120),
  phone: z.string().min(7).max(20).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const requestOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.nativeEnum(OtpPurpose),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(AUTH.OTP_LENGTH),
  purpose: z.nativeEnum(OtpPurpose),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(AUTH.OTP_LENGTH),
  newPassword: password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});
