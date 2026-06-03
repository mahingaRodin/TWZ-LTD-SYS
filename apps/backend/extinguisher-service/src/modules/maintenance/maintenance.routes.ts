import { Router } from 'express';
import { UserRole } from '@fire-system/shared-types';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import {
  AppError,
  asyncHandler,
  buildPaginated,
  ok,
  parsePagination,
  validateBody,
} from '@fire-system/shared-utils';
import { authenticate, authorize } from '../../auth';
import { extinguisherRepository } from '../extinguisher/extinguisher.repository';
import { maintenanceRepository } from './maintenance.repository';
import { logMaintenanceSchema } from './maintenance.validation';

export const maintenanceRouter = Router();

maintenanceRouter.use(authenticate);

// Log a maintenance activity (inspectors + admins).
maintenanceRouter.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.INSPECTOR),
  validateBody(logMaintenanceSchema),
  asyncHandler(async (req, res) => {
    const extinguisher = await extinguisherRepository.findById(req.body.extinguisherId);
    if (!extinguisher) throw AppError.notFound('Extinguisher not found');

    const log = await maintenanceRepository.create({ ...req.body, performedBy: req.user!.sub });
    res.status(HTTP_STATUS.CREATED).json(ok(log, 'Maintenance logged'));
  }),
);

// List maintenance history (paginated; filter by extinguisherId).
maintenanceRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req.query);
    const extinguisherId =
      typeof req.query.extinguisherId === 'string' ? req.query.extinguisherId : undefined;
    const performedByMe = req.query.performedByMe === 'true';
    let performedBy =
      typeof req.query.performedBy === 'string' ? req.query.performedBy : undefined;
    if (performedByMe) {
      performedBy = req.user!.sub;
    }
    if (req.user!.role === UserRole.INSPECTOR && !performedBy && !extinguisherId) {
      performedBy = req.user!.sub;
    }
    const { items, total } = await maintenanceRepository.list(
      { extinguisherId, performedBy },
      pageSize,
      offset,
    );
    res.json(ok(buildPaginated(items, total, page, pageSize)));
  }),
);
