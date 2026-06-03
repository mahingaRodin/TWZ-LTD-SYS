import { Router } from 'express';
import { asyncHandler, createAuth, createRateLimiter, validateBody } from '@fire-system/shared-utils';
import { env } from '../../config/env';
import { authController } from './auth.controller';
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

const { authenticate } = createAuth(() => env.JWT_SECRET);

// Tighter limit on credential / OTP endpoints to slow brute-force attempts.
const sensitiveLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

export const authRouter = Router();

// Public endpoints
authRouter.post(
  '/register',
  sensitiveLimiter,
  validateBody(registerSchema),
  asyncHandler(authController.register),
);
authRouter.post('/login', sensitiveLimiter, validateBody(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(authController.refresh));
authRouter.post('/logout', validateBody(refreshSchema), asyncHandler(authController.logout));

authRouter.post(
  '/otp/request',
  sensitiveLimiter,
  validateBody(requestOtpSchema),
  asyncHandler(authController.requestOtp),
);
authRouter.post(
  '/otp/verify',
  sensitiveLimiter,
  validateBody(verifyOtpSchema),
  asyncHandler(authController.verifyOtp),
);
authRouter.post(
  '/password/reset',
  sensitiveLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

// Authenticated endpoints
authRouter.get('/me', authenticate, asyncHandler(authController.me));
authRouter.patch(
  '/me',
  authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(authController.updateProfile),
);
authRouter.post(
  '/password/change',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
