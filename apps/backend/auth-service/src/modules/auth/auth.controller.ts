import { Request, Response } from 'express';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import { AppError, ok } from '@fire-system/shared-utils';
import { authService } from './auth.service';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    res.status(HTTP_STATUS.CREATED).json(ok(result, result.message));
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    res.status(HTTP_STATUS.OK).json(ok(result, 'Logged in'));
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.status(HTTP_STATUS.OK).json(ok(tokens));
  },

  async logout(req: Request, res: Response): Promise<void> {
    await authService.logout(req.body.refreshToken);
    res.status(HTTP_STATUS.OK).json(ok({ loggedOut: true }));
  },

  async requestOtp(req: Request, res: Response): Promise<void> {
    const result = await authService.requestOtp(req.body);
    res.status(HTTP_STATUS.OK).json(ok(result));
  },

  async verifyOtp(req: Request, res: Response): Promise<void> {
    const result = await authService.verifyOtp(req.body);
    res.status(HTTP_STATUS.OK).json(ok(result, 'Code verified'));
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body);
    res.status(HTTP_STATUS.OK).json(ok({ reset: true }, 'Password updated'));
  },

  async changePassword(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    await authService.changePassword(req.user.sub, req.body);
    res.status(HTTP_STATUS.OK).json(ok({ changed: true }, 'Password updated'));
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const user = await authService.updateProfile(req.user.sub, req.body);
    res.status(HTTP_STATUS.OK).json(ok(user, 'Profile updated'));
  },

  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) throw AppError.unauthorized();
    const user = await authService.getProfile(req.user.sub);
    res.status(HTTP_STATUS.OK).json(ok(user));
  },
};
