import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { validateBody } from '../../middleware/validate.middleware';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from './auth.validation';

export const authRouter = Router();

// Public endpoints
authRouter.post('/register', validateBody(registerSchema), asyncHandler(authController.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', validateBody(refreshSchema), asyncHandler(authController.refresh));
authRouter.post('/logout', validateBody(refreshSchema), asyncHandler(authController.logout));

authRouter.post(
  '/otp/request',
  validateBody(requestOtpSchema),
  asyncHandler(authController.requestOtp),
);
authRouter.post('/otp/verify', validateBody(verifyOtpSchema), asyncHandler(authController.verifyOtp));
authRouter.post(
  '/password/reset',
  validateBody(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

// Authenticated endpoints
authRouter.get('/me', authenticate, asyncHandler(authController.me));
authRouter.post(
  '/password/change',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword),
);
