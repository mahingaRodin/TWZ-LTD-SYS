import { Request, Response } from 'express';
import { UserRole } from '@fire-system/shared-types';
import { HTTP_STATUS } from '@fire-system/shared-constants';
import { ok, parsePagination } from '@fire-system/shared-utils';
import { usersService } from './users.service';
import type { createUserSchema, updateUserSchema } from '../auth/auth.validation';
import type { z } from 'zod';

export const usersController = {
  async list(req: Request, res: Response): Promise<void> {
    const { page, pageSize, offset } = parsePagination(req.query);
    const role =
      typeof req.query.role === 'string' && Object.values(UserRole).includes(req.query.role as UserRole)
        ? (req.query.role as UserRole)
        : undefined;

    const result = await usersService.list(role, page, pageSize);
    res.json(ok(result));
  },

  async create(req: Request, res: Response): Promise<void> {
    const user = await usersService.createByAdmin(req.body as z.infer<typeof createUserSchema>);
    res.status(HTTP_STATUS.CREATED).json(ok(user, 'User created'));
  },

  async update(req: Request, res: Response): Promise<void> {
    const user = await usersService.updateByAdmin(
      req.params.id,
      req.body as z.infer<typeof updateUserSchema>,
    );
    res.json(ok(user, 'User updated'));
  },

  async remove(req: Request, res: Response): Promise<void> {
    await usersService.deleteByAdmin(req.params.id, req.user!.sub);
    res.json(ok({ deleted: true }, 'User deleted'));
  },
};
