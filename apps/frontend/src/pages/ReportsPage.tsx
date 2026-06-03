import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import type { Paginated } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import * as reportsApi from '@/api/reports';
import type { ExpiredRow, MaintenanceRow } from '@/api/reports';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';

type ReportTab = 'stock' | 'inspections' | 'expired' | 'maintenance';

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('stock');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [stock, setStock] = useState<reportsApi.CountByKey[]>([]);
  const [inspections, setInspections] = useState<reportsApi.CountByKey[]>([]);
  const [expired, setExpired] = useState<Paginated<ExpiredRow> | null>(null);
  const [maintenance, setMaintenance] = useState<Paginated<MaintenanceRow> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const load = async () => {
      try {
        if (tab === 'stock') {
          setStock(await reportsApi.getStock(period));
        } else if (tab === 'inspections') {
          setInspections(await reportsApi.getInspectionBreakdown());
        } else if (tab === 'expired') {
          setExpired(await reportsApi.getExpired(page, DEFAULT_PAGE_SIZE));
        } else {
          setMaintenance(await reportsApi.getMaintenanceReport(page, DEFAULT_PAGE_SIZE));
        }
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, period, page]);

  const download = async (path: string, format: 'csv' | 'pdf', name: string, params?: Record<string, string>) => {
    setDownloading(`${path}-${format}`);
    setError('');
    try {
      await reportsApi.downloadReport(path, format, name, params);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDownloading('');
    }
  };

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'stock', label: 'Stock Intake' },
    { id: 'inspections', label: 'Inspection Status' },
    { id: 'expired', label: 'Expired Units' },
    { id: 'maintenance', label: 'Maintenance History' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Compliance Reports</h1>
        <p className="mt-1 text-sm text-muted">
          Real-time reports — export PDF or CSV (all authenticated users)
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rounded-card px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:text-text'
            }`}
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-surface flex flex-wrap items-center justify-between gap-4 p-4">
        <p className="text-sm text-muted">Download full report</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-secondary text-xs py-2"
            disabled={!!downloading}
            onClick={() =>
              download(
                tab === 'stock' ? '/stock' : tab === 'inspections' ? '/inspections' : `/${tab}`,
                'csv',
                `twz-${tab}.csv`,
                tab === 'stock' ? { period } : undefined,
              )
            }
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </button>
          <button
            type="button"
            className="btn-primary text-xs py-2"
            disabled={!!downloading}
            onClick={() =>
              download(
                tab === 'stock' ? '/stock' : tab === 'inspections' ? '/inspections' : `/${tab}`,
                'pdf',
                `twz-${tab}.pdf`,
                tab === 'stock' ? { period } : undefined,
              )
            }
          >
            <FileText className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {tab === 'stock' && (
        <select
          className="input-field max-w-xs"
          value={period}
          onChange={(e) => setPeriod(e.target.value as typeof period)}
        >
          <option value="daily">Daily</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card-surface overflow-x-auto bg-background/30 p-4">
          {tab === 'stock' && (
            <DataTable
              columns={['Period', 'Count']}
              rows={stock.map((r) => [r.key, r.count])}
            />
          )}
          {tab === 'inspections' && (
            <DataTable
              columns={['Status', 'Count']}
              rows={inspections.map((r) => [r.key, r.count])}
            />
          )}
          {tab === 'expired' && expired && (
            <>
              <DataTable
                columns={['Serial', 'Location', 'Type', 'Expiry', 'Status']}
                rows={expired.items.map((r) => [
                  r.serialNumber,
                  r.location,
                  r.type,
                  r.expiryDate,
                  r.status,
                ])}
              />
              <Pagination
                page={page}
                totalPages={expired.totalPages}
                total={expired.total}
                onPageChange={setPage}
              />
            </>
          )}
          {tab === 'maintenance' && maintenance && (
            <>
              <DataTable
                columns={['Serial', 'Action', 'Date', 'Condition']}
                rows={maintenance.items.map((r) => [
                  r.serialNumber,
                  r.actionTaken,
                  r.actionDate,
                  r.conditionNoted ?? '—',
                ])}
              />
              <Pagination
                page={page}
                totalPages={maintenance.totalPages}
                total={maintenance.total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}

      <p className="flex items-center gap-2 text-xs text-muted">
        <Download className="h-3 w-3" />
        Reports are generated live from the shared PostgreSQL database.
      </p>
    </div>
  );
}

function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-muted">No data for this report.</p>;
  }
  return (
    <table className="report-table w-full min-w-[480px] text-left text-sm">
      <thead>
        <tr className="border-b border-border bg-surface/80 text-xs uppercase tracking-wider text-muted">
          {columns.map((c) => (
            <th key={c} className="px-3 py-3 font-semibold">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-surface/40' : 'bg-transparent'}>
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-2.5 text-text">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
