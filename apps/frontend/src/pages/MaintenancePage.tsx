import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import type { Extinguisher, MaintenanceLog } from '@fire-system/shared-types';
import { UserRole } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { LogMaintenanceModal } from '@/components/LogMaintenanceModal';
import { Pagination } from '@/components/Pagination';
import * as extApi from '@/api/extinguishers';
import { useToast } from '@/components/Toast';
import type { MaintenanceLogDraft } from '@/lib/maintenanceDraft';
import * as maintApi from '@/api/maintenance';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { canLogMaintenance } from '@/lib/roles';
import { useAppSelector } from '@/store/hooks';

type MaintenanceLocationState = {
  maintenanceDraft?: MaintenanceLogDraft;
};

export function MaintenancePage() {
  const role = useAppSelector((s) => s.auth.user?.role ?? UserRole.USER);
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<MaintenanceLog[]>([]);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [inspectionDraft, setInspectionDraft] = useState<MaintenanceLogDraft | null>(null);
  const toast = useToast();

  const extMap = Object.fromEntries(extinguishers.map((e) => [e.id, e.serialNumber]));

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [logs, ext] = await Promise.all([
        maintApi.listMaintenance({
          page,
          pageSize: DEFAULT_PAGE_SIZE,
          ...(role === UserRole.INSPECTOR ? { performedByMe: true } : {}),
        }),
        extApi.listExtinguishers({ pageSize: 100 }),
      ]);
      setItems(logs.items);
      setTotalPages(logs.totalPages);
      setTotal(logs.total);
      setExtinguishers(ext.items);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const state = location.state as MaintenanceLocationState | null;
    if (!state?.maintenanceDraft) return;
    setInspectionDraft(state.maintenanceDraft);
    setLogOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const closeLogModal = () => {
    setLogOpen(false);
    setInspectionDraft(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Maintenance History</h1>
          <p className="mt-1 text-sm text-muted">
            {role === UserRole.INSPECTOR
              ? 'Log field maintenance and review your own activity history'
              : 'Track actions, dates, and conditions noted'}
          </p>
        </div>
        {canLogMaintenance(role) && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setInspectionDraft(null);
              setLogOpen(true);
            }}
          >
            <Wrench className="h-4 w-4" /> Log Maintenance
          </button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-muted">No maintenance records yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Condition</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-border/60 border-l-4 border-l-accent hover:bg-surface/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {extMap[log.extinguisherId] ?? '—'}
                    </td>
                    <td className="px-4 py-3">{log.actionTaken}</td>
                    <td className="px-4 py-3 text-muted">{log.actionDate}</td>
                    <td className="px-4 py-3 text-muted">{log.conditionNoted ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <LogMaintenanceModal
        open={logOpen}
        onClose={closeLogModal}
        extinguishers={extinguishers}
        draft={inspectionDraft}
        onSuccess={() => {
          closeLogModal();
          load();
          toast.success('Maintenance logged', 'The activity was saved to the unit history.');
        }}
      />
    </div>
  );
}
