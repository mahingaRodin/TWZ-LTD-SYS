import type {
  ApiResponse,
  Inspection,
  InspectionResult,
  InspectionStatus,
  Paginated,
} from '@fire-system/shared-types';
import { EXT_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(EXT_API);

export interface InspectionFilters {
  page?: number;
  pageSize?: number;
  extinguisherId?: string;
  status?: InspectionStatus;
  result?: InspectionResult;
  assignedToMe?: boolean;
}

export interface InspectionStats {
  ongoing: number;
  done: number;
  passed: number;
  failed: number;
  cancelled: number;
}

export async function getInspectionStats(assignedToMe?: boolean): Promise<InspectionStats> {
  const res = await api.get<ApiResponse<InspectionStats>>('/api/inspections/stats', {
    params: assignedToMe ? { assignedToMe: 'true' } : {},
  });
  return unwrap(res);
}

export async function listInspections(
  filters: InspectionFilters = {},
): Promise<Paginated<Inspection>> {
  const { assignedToMe, ...rest } = filters;
  const res = await api.get<ApiResponse<Paginated<Inspection>>>('/api/inspections', {
    params: { ...rest, ...(assignedToMe ? { assignedToMe: 'true' } : {}) },
  });
  return unwrap(res);
}

export async function scheduleInspection(payload: {
  extinguisherId: string;
  scheduledAt: string;
  inspectorId?: string;
  notes?: string;
}): Promise<Inspection> {
  const res = await api.post<ApiResponse<Inspection>>('/api/inspections', payload);
  return unwrap(res);
}

export async function completeInspection(
  id: string,
  result: InspectionResult,
  notes?: string,
): Promise<Inspection> {
  const res = await api.post<ApiResponse<Inspection>>(`/api/inspections/${id}/complete`, {
    result,
    notes,
  });
  return unwrap(res);
}

export async function cancelInspection(id: string): Promise<Inspection> {
  const res = await api.post<ApiResponse<Inspection>>(`/api/inspections/${id}/cancel`);
  return unwrap(res);
}
