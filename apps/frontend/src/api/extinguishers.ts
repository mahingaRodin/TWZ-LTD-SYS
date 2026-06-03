import type {
  ApiResponse,
  Extinguisher,
  ExtinguisherStatus,
  ExtinguisherType,
  Paginated,
} from '@fire-system/shared-types';
import { EXT_API } from '@/config';
import { createApi, unwrap } from './client';

const api = createApi(EXT_API);

export interface ExtinguisherFilters {
  page?: number;
  pageSize?: number;
  status?: ExtinguisherStatus;
  type?: ExtinguisherType;
  search?: string;
}

export interface CreateExtinguisherPayload {
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: string;
  installationDate: string;
  expiryDate: string;
  status?: ExtinguisherStatus;
}

export async function listExtinguishers(
  filters: ExtinguisherFilters = {},
): Promise<Paginated<Extinguisher>> {
  const res = await api.get<ApiResponse<Paginated<Extinguisher>>>('/api/extinguishers', {
    params: filters,
  });
  return unwrap(res);
}

export async function getExtinguisher(id: string): Promise<Extinguisher> {
  const res = await api.get<ApiResponse<Extinguisher>>(`/api/extinguishers/${id}`);
  return unwrap(res);
}

export async function createExtinguisher(
  payload: CreateExtinguisherPayload,
): Promise<Extinguisher> {
  const res = await api.post<ApiResponse<Extinguisher>>('/api/extinguishers', payload);
  return unwrap(res);
}

export async function updateExtinguisher(
  id: string,
  payload: Partial<CreateExtinguisherPayload>,
): Promise<Extinguisher> {
  const res = await api.put<ApiResponse<Extinguisher>>(`/api/extinguishers/${id}`, payload);
  return unwrap(res);
}

export async function deleteExtinguisher(id: string): Promise<void> {
  await api.delete(`/api/extinguishers/${id}`);
}
