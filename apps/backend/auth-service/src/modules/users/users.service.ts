import { Paginated, PublicUser, UserRole } from '@fire-system/shared-types';
import { DEFAULT_PROVISIONED_PASSWORD } from '@fire-system/shared-constants';
import {
  AppError,
  accountCreatedEmailHtml,
  buildPaginated,
  hashPassword,
} from '@fire-system/shared-utils';
import { sendEmail } from '../../utils/notifier';
import { userRepository } from '../../repositories/user.repository';
import type { z } from 'zod';
import type { createUserSchema, updateUserSchema } from '../auth/auth.validation';

type CreateUserDto = z.infer<typeof createUserSchema>;
type UpdateUserDto = z.infer<typeof updateUserSchema>;

function toPublic(user: Awaited<ReturnType<typeof userRepository.findById>>): PublicUser {
  if (!user) throw AppError.notFound('User not found');
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export const usersService = {
  async list(
    role: UserRole | undefined,
    page: number,
    pageSize: number,
  ): Promise<Paginated<PublicUser>> {
    const offset = (page - 1) * pageSize;
    const { items, total } = await userRepository.list({ role, limit: pageSize, offset });
    const publicItems = items.map((u) => {
      const { passwordHash: _passwordHash, ...rest } = u;
      return rest;
    });
    return buildPaginated(publicItems, total, page, pageSize);
  },

  /** Admin provisions an inspector or facility manager (email pre-verified). */
  async createByAdmin(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    const user = await userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      passwordHash: await hashPassword(DEFAULT_PROVISIONED_PASSWORD),
      role: dto.role,
      mustChangePassword: true,
    });
    await userRepository.markVerified(user.id);

    const plain = `Hello ${dto.firstName},\n\nYour ${dto.role} account is ready.\nEmail: ${dto.email}\nTemporary password: ${DEFAULT_PROVISIONED_PASSWORD}\n\nYou must change this password on first login.`;
    await sendEmail(
      dto.email,
      'Your TWZ Ltd account is ready',
      plain,
      accountCreatedEmailHtml(
        dto.firstName,
        dto.role,
        dto.email,
        DEFAULT_PROVISIONED_PASSWORD,
      ),
    );

    return toPublic(user);
  },

  async updateByAdmin(id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const target = await userRepository.findById(id);
    if (!target) {
      throw AppError.notFound('User not found');
    }
    if (target.role === UserRole.ADMIN) {
      throw AppError.forbidden('Cannot modify admin accounts via this endpoint');
    }

    if (dto.email && dto.email.toLowerCase() !== target.email.toLowerCase()) {
      const existing = await userRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw AppError.conflict('An account with this email already exists');
      }
    }

    try {
      const updated = await userRepository.updateByAdmin(id, dto);
      return toPublic(updated);
    } catch {
      throw AppError.notFound('User not found');
    }
  },

  async deleteByAdmin(id: string, actingAdminId: string): Promise<void> {
    if (id === actingAdminId) {
      throw AppError.forbidden('You cannot delete your own account');
    }

    const target = await userRepository.findById(id);
    if (!target) {
      throw AppError.notFound('User not found');
    }
    if (target.role === UserRole.ADMIN) {
      throw AppError.forbidden('Cannot delete admin accounts');
    }

    const deleted = await userRepository.deleteById(id);
    if (!deleted) {
      throw AppError.notFound('User not found');
    }
  },
};
