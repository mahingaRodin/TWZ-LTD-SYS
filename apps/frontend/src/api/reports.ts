import type { ApiResponse, Paginated } from '@fire-system/shared-types';
import { REPORTS_API } from '@/config';
import { createApi, unwrap } from './client';
import { getAccessToken } from '@/lib/storage';

const api = createApi(REPORTS_API);

export interface ReportSummary {
  generatedAt: string;
  totalExtinguishers: number;
  expiredCount: number;
  byStatus: { key: string; count: number }[];
  byType: { key: string; count: number }[];
  inspectionsByStatus: { key: string; count: number }[];
}

export interface CountByKey {
  key: string;
  count: number;
}

export interface ExpiredRow {
  serialNumber: string;
  location: string;
  type: string;
  expiryDate: string;
  status: string;
}

export interface MaintenanceRow {
  serialNumber: string;
  actionTaken: string;
  actionDate: string;
  conditionNoted: string | null;
}

export async function getSummary(): Promise<ReportSummary> {
  const res = await api.get<ApiResponse<ReportSummary>>('/api/reports/summary');
  return unwrap(res);
}

interface TabularReport {
  title: string;
  generatedAt: string;
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

function rowsToCounts(report: TabularReport): CountByKey[] {
  return report.rows.map(([key, count]) => ({
    key: String(key),
    count: Number(count),
  }));
}

export async function getStock(period: 'daily' | 'monthly' | 'yearly'): Promise<CountByKey[]> {
  const res = await api.get<ApiResponse<TabularReport>>('/api/reports/stock', {
    params: { period, format: 'json' },
  });
  return rowsToCounts(unwrap(res));
}

export async function getInspectionBreakdown(): Promise<CountByKey[]> {
  const res = await api.get<ApiResponse<TabularReport>>('/api/reports/inspections', {
    params: { format: 'json' },
  });
  return rowsToCounts(unwrap(res));
}

export async function getExpired(page = 1, pageSize = 20): Promise<Paginated<ExpiredRow>> {
  const res = await api.get<ApiResponse<Paginated<ExpiredRow>>>('/api/reports/expired', {
    params: { page, pageSize, format: 'json' },
  });
  return unwrap(res);
}

export async function getMaintenanceReport(
  page = 1,
  pageSize = 20,
): Promise<Paginated<MaintenanceRow>> {
  const res = await api.get<ApiResponse<Paginated<MaintenanceRow>>>('/api/reports/maintenance', {
    params: { page, pageSize, format: 'json' },
  });
  return unwrap(res);
}

export async function downloadReport(
  path: string,
  format: 'csv' | 'pdf',
  filename: string,
  params?: Record<string, string>,
): Promise<void> {
  const token = getAccessToken();
  const qs = new URLSearchParams({ format, ...params });
  const res = await fetch(`${REPORTS_API}/api/reports${path}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
