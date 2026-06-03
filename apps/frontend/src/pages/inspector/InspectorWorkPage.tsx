import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  UserRole,
  type Extinguisher,
  type Inspection,
  type MaintenanceLog,
} from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import {
  InspectionDashboardStats,
  InspectionFilterTabs,
  type InspectionListFilter,
} from '@/components/InspectionDashboardStats';
import { InspectionListCard } from '@/components/InspectionListCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import * as extApi from '@/api/extinguishers';
import * as inspectionsApi from '@/api/inspections';
import * as maintApi from '@/api/maintenance';
import { getErrorMessage } from '@/lib/errors';
import { inspectionFiltersForTab } from '@/lib/inspectionFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { useAppSelector } from '@/store/hooks';

type Tab = 'inspections' | 'maintenance';

export function InspectorWorkPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [tab, setTab] = useState<Tab>('inspections');
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [stats, setStats] = useState<inspectionsApi.InspectionStats | null>(null);
  const [listFilter, setListFilter] = useState<InspectionListFilter>('passed');
  const [inspPage, setInspPage] = useState(1);
  const [maintPage, setMaintPage] = useState(1);
  const [inspTotalPages, setInspTotalPages] = useState(1);
  const [inspTotal, setInspTotal] = useState(0);
  const [maintTotalPages, setMaintTotalPages] = useState(1);
  const [maintTotal, setMaintTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const extMap = Object.fromEntries(extinguishers.map((e) => [e.id, e]));

  const loadInspections = useCallback(async () => {
    const tabFilters = inspectionFiltersForTab(listFilter);
    const [insp, inspectionStats] = await Promise.all([
      inspectionsApi.listInspections({
        page: inspPage,
        pageSize: DEFAULT_PAGE_SIZE,
        assignedToMe: true,
        ...tabFilters,
      }),
      inspectionsApi.getInspectionStats(true),
    ]);
    setInspections(insp.items);
    setInspTotalPages(insp.totalPages);
    setInspTotal(insp.total);
    setStats(inspectionStats);
  }, [inspPage, listFilter]);

  const loadMaintenance = useCallback(async () => {
    const res = await maintApi.listMaintenance({
      page: maintPage,
      pageSize: DEFAULT_PAGE_SIZE,
      performedByMe: true,
    });
    setMaintenance(res.items);
    setMaintTotalPages(res.totalPages);
    setMaintTotal(res.total);
  }, [maintPage]);

  const load = useCallback(async () => {
    if (user?.role !== UserRole.INSPECTOR) return;
    setLoading(true);
    setError('');
    try {
      const ext = await extApi.listExtinguishers({ pageSize: 100 });
      setExtinguishers(ext.items);
      if (tab === 'inspections') {
        await loadInspections();
      } else {
        await loadMaintenance();
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user?.role, tab, loadInspections, loadMaintenance]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role !== UserRole.INSPECTOR || tab !== 'inspections') return;
    loadInspections().catch((e) => setError(getErrorMessage(e)));
  }, [inspPage, listFilter, loadInspections, tab, user?.role]);

  useEffect(() => {
    if (user?.role !== UserRole.INSPECTOR || tab !== 'maintenance') return;
    loadMaintenance().catch((e) => setError(getErrorMessage(e)));
  }, [maintPage, loadMaintenance, tab, user?.role]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inspection results</h1>
        <p className="mt-1 text-sm text-muted">
          Your completed inspections — passed and failed only. Ongoing work is under{' '}
          <Link to="/app/inspector" className="text-accent hover:underline">
            My assignments
          </Link>
          .
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === 'inspections'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
          onClick={() => setTab('inspections')}
        >
          <ClipboardCheck className="h-4 w-4" />
          Pass / Fail
        </button>
        <button
          type="button"
          className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === 'maintenance'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted hover:text-text'
          }`}
          onClick={() => setTab('maintenance')}
        >
          <Wrench className="h-4 w-4" />
          Maintenance logs
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tab === 'inspections' ? (
        <>
          {stats && <InspectionDashboardStats stats={stats} />}
          {stats && (
            <InspectionFilterTabs
              value={listFilter}
              onChange={(v) => {
                setListFilter(v);
                setInspPage(1);
              }}
              stats={stats}
              hideAll
            />
          )}
          {inspections.length === 0 ? (
            <p className="py-12 text-center text-muted">
              No {listFilter === 'passed' ? 'passed' : 'failed'} inspections yet.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {inspections.map((insp) => {
                  const ex = extMap[insp.extinguisherId];
                  return (
                    <InspectionListCard
                      key={insp.id}
                      insp={insp}
                      serial={ex?.serialNumber ?? 'Unit'}
                      location={ex?.location}
                      role={UserRole.INSPECTOR}
                    />
                  );
                })}
              </div>
              <Pagination
                page={inspPage}
                totalPages={inspTotalPages}
                total={inspTotal}
                onPageChange={setInspPage}
              />
            </>
          )}
        </>
      ) : maintenance.length === 0 ? (
        <p className="py-12 text-center text-muted">No maintenance logs yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto card-surface bg-background/30">
            <table className="report-table w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/80 text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Condition</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.map((log, i) => {
                  const unit = extMap[log.extinguisherId];
                  return (
                    <tr key={log.id} className={i % 2 === 0 ? 'bg-surface/40' : 'bg-transparent'}>
                      <td className="px-4 py-3 font-medium">
                        {unit?.serialNumber ?? '—'}
                        {unit?.location && (
                          <span className="block text-xs font-normal text-muted">{unit.location}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{log.actionTaken}</td>
                      <td className="px-4 py-3 text-muted">{log.actionDate}</td>
                      <td className="px-4 py-3 text-muted">{log.conditionNoted ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={maintPage}
            totalPages={maintTotalPages}
            total={maintTotal}
            onPageChange={setMaintPage}
          />
        </>
      )}
    </div>
  );
}
