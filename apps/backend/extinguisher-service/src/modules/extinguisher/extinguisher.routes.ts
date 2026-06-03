import { Router } from 'express';
import { ExtinguisherStatus, ExtinguisherType, UserRole } from '@fire-system/shared-types';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import { asyncHandler, ok, parsePagination, validateBody } from '@fire-system/shared-utils';
import { authenticate, authorize } from '../../auth';
import { extinguisherService } from './extinguisher.service';
import { createExtinguisherSchema, updateExtinguisherSchema } from './extinguisher.validation';

export const extinguisherRouter = Router();

// Everything here requires a valid token.
extinguisherRouter.use(authenticate);

// Register a new extinguisher (admins manage the inventory).
extinguisherRouter.post(
  '/',
  authorize(UserRole.ADMIN),
  validateBody(createExtinguisherSchema),
  asyncHandler(async (req, res) => {
    const created = await extinguisherService.create(req.body, req.user!.sub);
    res.status(HTTP_STATUS.CREATED).json(ok(created, 'Extinguisher registered'));
  }),
);

// List all extinguishers (paginated, with optional status/type/search filters).
extinguisherRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = parsePagination(req.query);
    const result = await extinguisherService.list(
      {
        status: req.query.status as ExtinguisherStatus | undefined,
        type: req.query.type as ExtinguisherType | undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        limit: pageSize,
        offset,
      },
      page,
      pageSize,
    );
    res.json(ok(result));
  }),
);

// View a single extinguisher by id.
extinguisherRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const found = await extinguisherService.getById(req.params.id);
    res.json(ok(found));
  }),
);

// Update extinguisher info (admins only).
extinguisherRouter.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateBody(updateExtinguisherSchema),
  asyncHandler(async (req, res) => {
    const updated = await extinguisherService.update(req.params.id, req.body);
    res.json(ok(updated, 'Extinguisher updated'));
  }),
);

// Remove an extinguisher record (admins only).
extinguisherRouter.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  asyncHandler(async (req, res) => {
    await extinguisherService.remove(req.params.id);
    res.json(ok({ deleted: true }, 'Extinguisher removed'));
  }),
);
