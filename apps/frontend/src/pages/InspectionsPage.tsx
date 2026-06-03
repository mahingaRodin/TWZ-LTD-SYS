import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarPlus } from 'lucide-react';
import {
  InspectionResult,
  InspectionStatus,
  type Extinguisher,
  type Inspection,
  type PublicUser,
  UserRole,
} from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import {
  InspectionDashboardStats,
  InspectionFilterTabs,
  type InspectionListFilter,
} from '@/components/InspectionDashboardStats';
import { InspectionListCard } from '@/components/InspectionListCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/components/Toast';
import * as extApi from '@/api/extinguishers';
import * as inspApi from '@/api/inspections';
import * as usersApi from '@/api/users';
import { getErrorMessage } from '@/lib/errors';
import { inspectionFiltersForTab } from '@/lib/inspectionFilters';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { RESULT_LABELS } from '@/lib/labels';
import { useAppSelector } from '@/store/hooks';

export function InspectionsPage() {
  const location = useLocation();
  const preselectedExt = (location.state as { extinguisherId?: string })?.extinguisherId;
  const role = useAppSelector((s) => s.auth.user?.role ?? UserRole.USER);

  const [items, setItems] = useState<Inspection[]>([]);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [inspectors, setInspectors] = useState<PublicUser[]>([]);
  const [stats, setStats] = useState<inspApi.InspectionStats | null>(null);
  const [listFilter, setListFilter] = useState<InspectionListFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(Boolean(preselectedExt));
  const [completeOpen, setCompleteOpen] = useState<Inspection | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const tabFilters = inspectionFiltersForTab(listFilter);
      const [insp, ext, staff, inspectionStats] = await Promise.all([
        inspApi.listInspections({
          page,
          pageSize: DEFAULT_PAGE_SIZE,
          ...tabFilters,
        }),
        extApi.listExtinguishers({ pageSize: 100 }),
        usersApi.listUsers({ role: UserRole.INSPECTOR, pageSize: 100 }).catch(() => ({
          items: [] as PublicUser[],
          totalPages: 1,
          page: 1,
          pageSize: 100,
          total: 0,
        })),
        inspApi.getInspectionStats(),
      ]);
      setItems(insp.items);
      setTotalPages(insp.totalPages);
      setTotal(insp.total);
      setExtinguishers(ext.items);
      setInspectors(staff.items);
      setStats(inspectionStats);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, listFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Assign Inspections</h1>
          <p className="mt-1 text-sm text-muted">
            Fleet-wide inspection dashboard — ongoing, completed, passed, and failed
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setScheduleOpen(true)}>
          <CalendarPlus className="h-4 w-4" /> Schedule Inspection
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {stats && <InspectionDashboardStats stats={stats} />}

      {stats && (
        <InspectionFilterTabs
          value={listFilter}
          onChange={(v) => {
            setListFilter(v);
            setPage(1);
          }}
          stats={stats}
        />
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="py-12 text-center text-muted">No inspections in this view.</p>
            ) : (
              items.map((insp) => {
                const ex = extinguishers.find((e) => e.id === insp.extinguisherId);
                return (
                  <InspectionListCard
                    key={insp.id}
                    insp={insp}
                    serial={ex?.serialNumber ?? insp.extinguisherId.slice(0, 8)}
                    location={ex?.location}
                    role={role}
                    onComplete={() => setCompleteOpen(insp)}
                    onCancel={async () => {
                      try {
                        await inspApi.cancelInspection(insp.id);
                        toast.success('Inspection cancelled');
                        load();
                      } catch (e) {
                        setError(getErrorMessage(e));
                      }
                    }}
                  />
                );
              })
            )}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <ScheduleModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        extinguishers={extinguishers}
        inspectors={inspectors}
        defaultExtId={preselectedExt}
        onSuccess={() => {
          setScheduleOpen(false);
          load();
          toast.success('Inspection scheduled', 'The field visit was added to the calendar.');
        }}
      />

      <CompleteModal
        inspection={completeOpen}
        onClose={() => setCompleteOpen(null)}
        onSuccess={() => {
          setCompleteOpen(null);
          load();
          toast.success('Inspection completed', 'Results were recorded successfully.');
        }}
      />
    </div>
  );
}

function ScheduleModal({
  open,
  onClose,
  extinguishers,
  inspectors,
  defaultExtId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  extinguishers: Extinguisher[];
  inspectors: PublicUser[];
  defaultExtId?: string;
  onSuccess: () => void;
}) {
  const [extinguisherId, setExtinguisherId] = useState(defaultExtId ?? '');
  const [inspectorId, setInspectorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultExtId) setExtinguisherId(defaultExtId);
  }, [defaultExtId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await inspApi.scheduleInspection({
        extinguisherId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        inspectorId: inspectorId || undefined,
        notes: notes || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule Inspection" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <label className="label-field">Extinguisher</label>
          <select
            required
            className="input-field"
            value={extinguisherId}
            onChange={(e) => setExtinguisherId(e.target.value)}
          >
            <option value="">Select unit…</option>
            {extinguishers.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.serialNumber} — {ex.location}
              </option>
            ))}
          </select>
        </div>
        {inspectors.length > 0 && (
          <div>
            <label className="label-field">Assign Inspector (notified by email)</label>
            <select
              className="input-field"
              value={inspectorId}
              onChange={(e) => setInspectorId(e.target.value)}
            >
              <option value="">Auto / unassigned</option>
              {inspectors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.firstName} {i.lastName} — {i.email}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label-field">Date & Time</label>
          <input
            type="datetime-local"
            required
            className="input-field"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Notes (optional)</label>
          <textarea
            className="input-field min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Scheduling…' : 'Schedule & Notify'}
        </button>
      </form>
    </Modal>
  );
}

function CompleteModal({
  inspection,
  onClose,
  onSuccess,
}: {
  inspection: Inspection | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [result, setResult] = useState<InspectionResult>(InspectionResult.PASS);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inspection) return;
    setError('');
    setLoading(true);
    try {
      await inspApi.completeInspection(inspection.id, result, notes || undefined);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!inspection} onClose={onClose} title="Complete Inspection">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex gap-4">
          <label className="flex min-h-[48px] flex-1 cursor-pointer items-center gap-3 rounded-card border border-border bg-surface px-4 has-[:checked]:border-success has-[:checked]:ring-2 has-[:checked]:ring-success/30">
            <input
              type="radio"
              name="result"
              className="h-6 w-6 accent-success"
              checked={result === InspectionResult.PASS}
              onChange={() => setResult(InspectionResult.PASS)}
            />
            <span className="font-semibold text-success">{RESULT_LABELS.PASS}</span>
          </label>
          <label className="flex min-h-[48px] flex-1 cursor-pointer items-center gap-3 rounded-card border border-border bg-surface px-4 has-[:checked]:border-danger has-[:checked]:ring-2 has-[:checked]:ring-danger/30">
            <input
              type="radio"
              name="result"
              className="h-6 w-6 accent-danger"
              checked={result === InspectionResult.FAIL}
              onChange={() => setResult(InspectionResult.FAIL)}
            />
            <span className="font-semibold text-danger">{RESULT_LABELS.FAIL}</span>
          </label>
        </div>
        <div>
          <label className="label-field">Notes</label>
          <textarea
            className="input-field min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Saving…' : 'Log Result'}
        </button>
      </form>
    </Modal>
  );
}
