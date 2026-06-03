import type {
  ApiResponse,
  InspectionRequest,
  InspectionRequestStatus,
  Paginated,
} from '@fire-system/shared-types';
import { EXT_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(EXT_API);

export interface InspectionRequestStats {
  pending: number;
  reviewing: number;
  denied: number;
  approved: number;
  total: number;
}

export async function getRequestStats(): Promise<InspectionRequestStats> {
  const res = await api.get<ApiResponse<InspectionRequestStats>>('/api/inspection-requests/stats');
  return unwrap(res);
}

export async function createRequest(payload: {
  extinguisherId: string;
  preferredAt: string;
  notes?: string;
}): Promise<InspectionRequest> {
  const res = await api.post<ApiResponse<InspectionRequest>>('/api/inspection-requests', payload);
  return unwrap(res);
}

export async function getRequest(id: string): Promise<InspectionRequest> {
  const res = await api.get<ApiResponse<InspectionRequest>>(`/api/inspection-requests/${id}`);
  return unwrap(res);
}

export async function listRequests(params?: {
  page?: number;
  pageSize?: number;
  status?: InspectionRequestStatus;
}): Promise<Paginated<InspectionRequest>> {
  const res = await api.get<ApiResponse<Paginated<InspectionRequest>>>('/api/inspection-requests', {
    params,
  });
  return unwrap(res);
}

export async function acknowledgeRequestAlert(id: string): Promise<void> {
  await api.post(`/api/inspection-requests/${id}/acknowledge-alert`);
}

export async function reviewRequest(
  id: string,
  payload: {
    status: InspectionRequestStatus;
    adminNotes?: string;
    inspectorId?: string;
    scheduledAt?: string;
  },
): Promise<InspectionRequest> {
  const res = await api.patch<ApiResponse<InspectionRequest>>(
    `/api/inspection-requests/${id}/review`,
    payload,
  );
  return unwrap(res);
}
