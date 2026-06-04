import type { ApiResponse, InspectorAlert } from '@fire-system/shared-types';
import { EXT_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(EXT_API);

export async function listInspectorAlerts(): Promise<InspectorAlert[]> {
  const res = await api.get<ApiResponse<InspectorAlert[]>>('/api/inspector-alerts');
  return unwrap(res);
}
