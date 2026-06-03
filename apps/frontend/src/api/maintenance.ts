import type { ApiResponse, MaintenanceLog, Paginated } from '@fire-system/shared-types';
import { EXT_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(EXT_API);

export async function listMaintenance(params: {
  page?: number;
  pageSize?: number;
  extinguisherId?: string;
  performedByMe?: boolean;
}): Promise<Paginated<MaintenanceLog>> {
  const { performedByMe, ...rest } = params;
  const res = await api.get<ApiResponse<Paginated<MaintenanceLog>>>('/api/maintenance', {
    params: { ...rest, ...(performedByMe ? { performedByMe: 'true' } : {}) },
  });
  return unwrap(res);
}

export async function logMaintenance(payload: {
  extinguisherId: string;
  actionTaken: string;
  actionDate: string;
  conditionNoted?: string;
}): Promise<MaintenanceLog> {
  const res = await api.post<ApiResponse<MaintenanceLog>>('/api/maintenance', payload);
  return unwrap(res);
}
