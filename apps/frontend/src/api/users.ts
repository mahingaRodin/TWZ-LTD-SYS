import type { ApiResponse, Paginated, PublicUser, UserRole } from '@fire-system/shared-types';
import { AUTH_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(AUTH_API);

export async function listUsers(params?: {
  role?: UserRole;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<PublicUser>> {
  const res = await api.get<ApiResponse<Paginated<PublicUser>>>('/api/auth/users', { params });
  return unwrap(res);
}

export async function createUser(payload: {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole.INSPECTOR | UserRole.USER;
}): Promise<PublicUser> {
  const res = await api.post<ApiResponse<PublicUser>>('/api/auth/users', payload);
  return unwrap(res);
}

export async function updateUser(
  id: string,
  payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: UserRole.INSPECTOR | UserRole.USER;
    isActive?: boolean;
    isVerified?: boolean;
  },
): Promise<PublicUser> {
  const res = await api.patch<ApiResponse<PublicUser>>(`/api/auth/users/${id}`, payload);
  return unwrap(res);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/auth/users/${id}`);
}
