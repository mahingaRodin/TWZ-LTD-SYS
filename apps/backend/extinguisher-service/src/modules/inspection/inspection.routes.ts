import { Router } from 'express';
import { InspectionResult, InspectionStatus, UserRole } from '@fire-system/shared-types';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import { asyncHandler, ok, parsePagination, validateBody } from '@fire-system/shared-utils';
import { authenticate, authorize } from '../../auth';
import { inspectionService } from './inspection.service';
import { completeInspectionSchema, scheduleInspectionSchema } from './inspection.validation';

export const inspectionRouter = Router();

inspectionRouter.use(authenticate);

// Schedule an inspection directly (admin assigns work to inspectors).
inspectionRouter.post(
  '/',
  authorize(UserRole.ADMIN),
  validateBody(scheduleInspectionSchema),
  asyncHandler(async (req, res) => {
    const created = await inspectionService.schedule({ ...req.body, createdBy: req.user!.sub });
    res.status(HTTP_STATUS.CREATED).json(ok(created, 'Inspection scheduled'));
  }),
);

inspectionRouter.get(
  '/stats',
  authorize(UserRole.ADMIN, UserRole.INSPECTOR),
  asyncHandler(async (req, res) => {
    const assignedToMe = req.query.assignedToMe === 'true';
    const inspectorId = assignedToMe ? req.user!.sub : undefined;
    res.json(ok(await inspectionService.stats(inspectorId)));
  }),
);

// List inspections (paginated; filter by extinguisherId / status / result).
inspectionRouter.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.INSPECTOR),
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req.query);
    const assignedToMe = req.query.assignedToMe === 'true';
    const resultKey =
      typeof req.query.result === 'string' &&
      Object.values(InspectionResult).includes(req.query.result as InspectionResult)
        ? (req.query.result as InspectionResult)
        : undefined;
    const result = await inspectionService.list(
      {
        extinguisherId:
          typeof req.query.extinguisherId === 'string' ? req.query.extinguisherId : undefined,
        inspectorId: assignedToMe ? req.user!.sub : undefined,
        status: req.query.status as InspectionStatus | undefined,
        result: resultKey,
        limit: pageSize,
        offset,
      },
      page,
      pageSize,
    );
    res.json(ok(result));
  }),
);

inspectionRouter.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.INSPECTOR),
  asyncHandler(async (req, res) => {
    res.json(ok(await inspectionService.getById(req.params.id)));
  }),
);

// Log the inspection result (inspectors + admins).
inspectionRouter.post(
  '/:id/complete',
  authorize(UserRole.ADMIN, UserRole.INSPECTOR),
  validateBody(completeInspectionSchema),
  asyncHandler(async (req, res) => {
    const updated = await inspectionService.complete(req.params.id, req.body.result, req.body.notes);
    res.json(ok(updated, 'Inspection completed'));
  }),
);

inspectionRouter.post(
  '/:id/cancel',
  authorize(UserRole.ADMIN, UserRole.INSPECTOR),
  asyncHandler(async (req, res) => {
    res.json(ok(await inspectionService.cancel(req.params.id), 'Inspection cancelled'));
  }),
);
