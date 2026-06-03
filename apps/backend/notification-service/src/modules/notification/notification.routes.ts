import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok, validateBody } from '@fire-system/shared-utils';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import { notificationService } from './notification.service';

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1),
  html: z.string().optional(),
});

export const notificationRouter = Router();

/**
 * Internal email gateway used by other services (auth, extinguisher).
 * POST /api/notifications/email { to, subject, body }
 */
notificationRouter.post(
  '/email',
  validateBody(emailSchema),
  asyncHandler(async (req, res) => {
    const result = await notificationService.sendEmail(req.body);
    res.status(HTTP_STATUS.OK).json(ok(result));
  }),
);
