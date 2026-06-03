import { Router } from 'express';
import { UserRole } from '@fire-system/shared-types';
import { AppError, asyncHandler, ok } from '@fire-system/shared-utils';
import { authenticate, authorize } from '../../auth';
import { alertRepository } from './alert.repository';
import { scanExpiryCritical } from './expiryScanner';

export const alertRouter = Router();

alertRouter.use(authenticate, authorize(UserRole.ADMIN));

alertRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    await scanExpiryCritical();
    res.json(ok(await alertRepository.listOpen()));
  }),
);

alertRouter.post(
  '/:id/acknowledge',
  asyncHandler(async (req, res) => {
    const alert = await alertRepository.acknowledge(req.params.id);
    if (!alert) throw AppError.notFound('Alert not found');
    res.json(ok(alert, 'Alert acknowledged'));
  }),
);
