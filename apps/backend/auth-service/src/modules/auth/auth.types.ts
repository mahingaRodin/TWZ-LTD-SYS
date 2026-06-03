import { z } from 'zod';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  requestOtpSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from './auth.validation';

// DTOs are inferred from the Zod schemas so the validation layer is the single
// source of truth for request shapes.
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type RequestOtpDto = z.infer<typeof requestOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
