import { z } from 'zod';
import { OtpPurpose, UserRole } from '@fire-system/shared-types';
import { AUTH } from '@fire-system/shared-constants';

const password = z.string().min(AUTH.MIN_PASSWORD_LENGTH, {
  message: `Password must be at least ${AUTH.MIN_PASSWORD_LENGTH} characters`,
});

const name = z.string().trim().min(1).max(60);

export const registerSchema = z.object({
  firstName: name,
  lastName: name,
  email: z.string().email(),
  password,
});

/** Admin-only: provision inspectors or facility managers (default password applied server-side). */
export const createUserSchema = z.object({
  firstName: name,
  lastName: name,
  email: z.string().email(),
  role: z.enum([UserRole.INSPECTOR, UserRole.USER]),
});

export const listUsersQuerySchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateUserSchema = z
  .object({
    firstName: name.optional(),
    lastName: name.optional(),
    email: z.string().email().optional(),
    role: z.enum([UserRole.INSPECTOR, UserRole.USER]).optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
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

export const updateProfileSchema = z
  .object({
    firstName: name.optional(),
    lastName: name.optional(),
  })
  .refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
    message: 'Provide at least one field to update',
  });
