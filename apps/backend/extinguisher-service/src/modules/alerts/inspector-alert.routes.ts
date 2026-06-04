import { Router } from 'express';
import { UserRole } from '@fire-system/shared-types';
import { asyncHandler, ok } from '@fire-system/shared-utils';
import { authenticate, authorize } from '../../auth';
import { scanInspectionDueSoon } from './inspectionDueScanner';
import { inspectorAlertRepository } from './inspector-alert.repository';

export const inspectorAlertRouter = Router();

inspectorAlertRouter.use(authenticate, authorize(UserRole.INSPECTOR));

inspectorAlertRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    await scanInspectionDueSoon();
    res.json(ok(await inspectorAlertRepository.listOpenForInspector(req.user!.sub)));
  }),
);
