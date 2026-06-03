import type { AdminAlert, ApiResponse } from '@fire-system/shared-types';
import { EXT_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(EXT_API);

export async function listOpenAlerts(): Promise<AdminAlert[]> {
  const res = await api.get<ApiResponse<AdminAlert[]>>('/api/alerts');
  return unwrap(res);
}

export async function acknowledgeAlert(id: string): Promise<AdminAlert> {
  const res = await api.post<ApiResponse<AdminAlert>>(`/api/alerts/${id}/acknowledge`);
  return unwrap(res);
}
