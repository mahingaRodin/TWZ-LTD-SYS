import { Router } from 'express';
import { InspectionRequestStatus, UserRole } from '@fire-system/shared-types';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import { AppError, asyncHandler, ok, parsePagination, validateBody } from '@fire-system/shared-utils';
import { authenticate, authorize } from '../../auth';
import { inspectionRequestService } from './inspection-request.service';
import {
  createInspectionRequestSchema,
  reviewInspectionRequestSchema,
} from './inspection-request.validation';

export const inspectionRequestRouter = Router();

inspectionRequestRouter.use(authenticate);

inspectionRequestRouter.post(
  '/',
  authorize(UserRole.USER),
  validateBody(createInspectionRequestSchema),
  asyncHandler(async (req, res) => {
    const created = await inspectionRequestService.create(req.body, req.user!.sub);
    res.status(HTTP_STATUS.CREATED).json(ok(created, 'Inspection request submitted'));
  }),
);

inspectionRequestRouter.get(
  '/stats',
  authorize(UserRole.ADMIN, UserRole.USER),
  asyncHandler(async (req, res) => {
    const stats = await inspectionRequestService.stats(req.user!.sub, req.user!.role);
    res.json(ok(stats));
  }),
);

inspectionRequestRouter.get(
  '/',
  authorize(UserRole.ADMIN, UserRole.USER),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = parsePagination(req.query);
    const isAdmin = req.user!.role === UserRole.ADMIN;
    if (!isAdmin && typeof req.query.requestedBy === 'string') {
      throw AppError.forbidden('You can only view your own inspection requests');
    }
    const result = await inspectionRequestService.list(
      {
        status: req.query.status as InspectionRequestStatus | undefined,
        // Facility users always see only their own requests (outcomes included).
        requestedBy: isAdmin
          ? typeof req.query.requestedBy === 'string'
            ? req.query.requestedBy
            : undefined
          : req.user!.sub,
      },
      page,
      pageSize,
    );
    res.json(ok(result));
  }),
);

inspectionRequestRouter.get(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.USER),
  asyncHandler(async (req, res) => {
    const request = await inspectionRequestService.getById(
      req.params.id,
      req.user!.sub,
      req.user!.role,
    );
    res.json(ok(request));
  }),
);

inspectionRequestRouter.post(
  '/:id/acknowledge-alert',
  authorize(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    await inspectionRequestService.acknowledgeAlert(req.params.id);
    res.json(ok({ acknowledged: true }));
  }),
);

inspectionRequestRouter.patch(
  '/:id/review',
  authorize(UserRole.ADMIN),
  validateBody(reviewInspectionRequestSchema),
  asyncHandler(async (req, res) => {
    const updated = await inspectionRequestService.review(req.params.id, req.body, req.user!.sub);
    res.json(ok(updated, 'Request updated'));
  }),
);
