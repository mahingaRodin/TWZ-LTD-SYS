import { Router } from 'express';
import { UserRole } from '@fire-system/shared-types';
import { asyncHandler, createAuth, validateBody } from '@fire-system/shared-utils';
import { env } from '../../config/env';
import { createUserSchema, updateUserSchema } from '../auth/auth.validation';
import { usersController } from './users.controller';

const { authenticate, authorize } = createAuth(() => env.JWT_SECRET);

export const usersRouter = Router();

usersRouter.use(authenticate, authorize(UserRole.ADMIN));

usersRouter.get('/', asyncHandler(usersController.list));
usersRouter.post('/', validateBody(createUserSchema), asyncHandler(usersController.create));
usersRouter.patch(
  '/:id',
  validateBody(updateUserSchema),
  asyncHandler(usersController.update),
);
usersRouter.delete('/:id', asyncHandler(usersController.remove));
