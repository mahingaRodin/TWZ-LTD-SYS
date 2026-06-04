import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardCheck, Wrench } from 'lucide-react';
import {
  InspectionResult,
  InspectionStatus,
  UserRole,
  type Extinguisher,
  type Inspection,
} from '@fire-system/shared-types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert } from '@/components/Alert';
import { InspectionDashboardStats } from '@/components/InspectionDashboardStats';
import { InspectionListCard } from '@/components/InspectionListCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import { refreshInspectorAlerts, useToast } from '@/components/Toast';
import * as extApi from '@/api/extinguishers';
import * as inspectionsApi from '@/api/inspections';
import { getErrorMessage } from '@/lib/errors';
import { RESULT_LABELS } from '@/lib/labels';
import { buildMaintenanceDraft } from '@/lib/maintenanceDraft';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { useAppSelector } from '@/store/hooks';

export function InspectorPortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('focus');
  const focusHandled = useRef<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const [items, setItems] = useState<Inspection[]>([]);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof inspectionsApi.getInspectionStats>> | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completeTarget, setCompleteTarget] = useState<Inspection | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [insp, ext, inspectionStats] = await Promise.all([
        inspectionsApi.listInspections({
          page,
          pageSize: DEFAULT_PAGE_SIZE,
          status: InspectionStatus.SCHEDULED,
          assignedToMe: true,
        }),
        extApi.listExtinguishers({ pageSize: 100 }),
        inspectionsApi.getInspectionStats(true),
      ]);
      setItems(insp.items);
      setTotalPages(insp.totalPages);
      setTotal(insp.total);
      setExtinguishers(ext.items);
      setStats(inspectionStats);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user?.role === UserRole.INSPECTOR) load();
  }, [load, user]);

  const clearFocusParam = () => {
    if (!searchParams.has('focus')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('focus');
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (!focusId || focusHandled.current === focusId) return;

    const openFocused = async () => {
      const onPage = items.find((i) => i.id === focusId);
      if (onPage) {
        setCompleteTarget(onPage);
        focusHandled.current = focusId;
        return;
      }
      if (loading) return;
      try {
        const insp = await inspectionsApi.getInspection(focusId);
        if (insp.status === InspectionStatus.SCHEDULED) {
          setCompleteTarget(insp);
          focusHandled.current = focusId;
        }
      } catch {
        focusHandled.current = focusId;
      }
    };

    void openFocused();
  }, [focusId, items, loading]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My assignments</h1>
        <p className="mt-1 text-sm text-muted">
          Ongoing inspections assigned to you — complete them, then view pass/fail under{' '}
          <Link to="/app/inspector/work" className="text-accent hover:underline">
            Inspection results
          </Link>
        </p>
      </div>
      {error && <Alert variant="error">{error}</Alert>}

      {stats && <InspectionDashboardStats stats={stats} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/app/maintenance" className="card-surface flex items-center gap-4 p-6 hover:border-accent">
          <Wrench className="h-8 w-8 text-accent" />
          <div>
            <p className="font-semibold">Log Maintenance</p>
            <p className="text-sm text-muted">Record actions after completing a visit</p>
          </div>
        </Link>
        <Link to="/app/inspector/work" className="card-surface flex items-center gap-4 p-6 hover:border-secondary">
          <ClipboardCheck className="h-5 w-5 text-secondary" />
          <div>
            <p className="font-semibold">Inspection results</p>
            <p className="text-sm text-muted">Passed & failed only ({stats?.passed ?? 0} pass, {stats?.failed ?? 0} fail)</p>
          </div>
        </Link>
      </div>

      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-secondary" /> Ongoing assignments
      </h2>
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p className="text-muted">No scheduled assignments right now.</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((insp) => {
              const ex = extinguishers.find((e) => e.id === insp.extinguisherId);
              return (
                <InspectionListCard
                  key={insp.id}
                  insp={insp}
                  serial={ex?.serialNumber ?? 'Assigned unit'}
                  location={ex?.location}
                  role={UserRole.INSPECTOR}
                  onComplete={() => setCompleteTarget(insp)}
                />
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
      <CompleteModal
        inspection={completeTarget}
        onClose={() => {
          setCompleteTarget(null);
          clearFocusParam();
        }}
        onDone={() => {
          setCompleteTarget(null);
          clearFocusParam();
          refreshInspectorAlerts();
          load();
        }}
      />
    </div>
  );
}

function CompleteModal({
  inspection,
  onClose,
  onDone,
}: {
  inspection: Inspection | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [result, setResult] = useState<InspectionResult>(InspectionResult.PASS);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (inspection) {
      setResult(InspectionResult.PASS);
      setNotes('');
      setError('');
    }
  }, [inspection]);

  const submit = async () => {
    if (!inspection) return;
    setLoading(true);
    setError('');
    try {
      await inspectionsApi.completeInspection(inspection.id, result, notes || undefined);
      refreshInspectorAlerts();
      toast.success('Inspection completed', 'Log maintenance for this unit next.');
      onDone();

      const draft = buildMaintenanceDraft({
        extinguisherId: inspection.extinguisherId,
        inspectionId: inspection.id,
        result,
        inspectionNotes: notes,
      });

      navigate('/app/maintenance', { state: { maintenanceDraft: draft } });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!inspection} onClose={onClose} title="Complete inspection">
      {error && <Alert variant="error">{error}</Alert>}
      <p className="text-sm text-muted">
        After you submit, you will be taken to the maintenance log with today&apos;s date prefilled.
      </p>
      <div className="flex gap-4 my-4">
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-card border border-border p-3">
          <input
            type="radio"
            checked={result === InspectionResult.PASS}
            onChange={() => setResult(InspectionResult.PASS)}
          />
          <span className="text-success font-semibold">{RESULT_LABELS.PASS}</span>
        </label>
        <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-card border border-border p-3">
          <input
            type="radio"
            checked={result === InspectionResult.FAIL}
            onChange={() => setResult(InspectionResult.FAIL)}
          />
          <span className="text-danger font-semibold">{RESULT_LABELS.FAIL}</span>
        </label>
      </div>
      <label className="label-field">Inspection notes (optional)</label>
      <textarea
        className="input-field min-h-[80px] w-full"
        placeholder="Observations from the field visit"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button type="button" className="btn-primary mt-4 w-full" disabled={loading} onClick={submit}>
        {loading ? 'Saving…' : 'Submit & log maintenance'}
      </button>
    </Modal>
  );
}
