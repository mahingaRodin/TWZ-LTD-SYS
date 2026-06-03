import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InspectionRequestStatus, UserRole, type InspectionRequest, type PublicUser } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import {
  RequestDashboardStats,
  RequestFilterTabs,
  type InspectionRequestStats,
} from '@/components/RequestDashboardStats';
import { StatusBadge } from '@/components/StatusBadge';
import { refreshAdminAlerts, useToast } from '@/components/Toast';
import * as inspectionRequestsApi from '@/api/inspectionRequests';
import * as usersApi from '@/api/users';
import { REQUEST_STATUS_LABELS } from '@/lib/labels';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import {
  requestStatusForFilter,
  type InspectionRequestListFilter,
} from '@/lib/requestFilters';

export function InspectionRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<InspectionRequest[]>([]);
  const [stats, setStats] = useState<InspectionRequestStats | null>(null);
  const [listFilter, setListFilter] = useState<InspectionRequestListFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<InspectionRequest | null>(null);
  const [inspectors, setInspectors] = useState<PublicUser[]>([]);

  const startReview = useCallback(async (r: InspectionRequest) => {
    if (
      r.status === InspectionRequestStatus.APPROVED ||
      r.status === InspectionRequestStatus.DENIED
    ) {
      return;
    }
    try {
      await inspectionRequestsApi.acknowledgeRequestAlert(r.id);
      refreshAdminAlerts();
    } catch {
      /* banner may already be cleared */
    }
    setSelected(r);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const status = requestStatusForFilter(listFilter);
      const [res, requestStats] = await Promise.all([
        inspectionRequestsApi.listRequests({
          page,
          pageSize: DEFAULT_PAGE_SIZE,
          status,
        }),
        inspectionRequestsApi.getRequestStats(),
      ]);
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
      setStats(requestStats);
    } catch (e) {
      setItems([]);
      setTotal(0);
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, listFilter]);

  useEffect(() => {
    load();
    usersApi.listUsers({ role: UserRole.INSPECTOR, pageSize: 100 }).then((r) => setInspectors(r.items));
  }, [load]);

  useEffect(() => {
    const reviewId = searchParams.get('review');
    if (!reviewId) return;

    let cancelled = false;
    (async () => {
      try {
        const request = await inspectionRequestsApi.getRequest(reviewId);
        if (cancelled) return;
        await startReview(request);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      } finally {
        if (!cancelled) setSearchParams({}, { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, startReview]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Inspection Requests</h1>
        <p className="mt-1 text-sm text-muted">
          Request dashboard — review facility submissions and assign inspectors
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {stats && <RequestDashboardStats stats={stats} />}

      {stats && (
        <RequestFilterTabs
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
          {items.length === 0 ? (
            <div className="card-surface py-16 text-center">
              <p className="text-lg font-medium text-text">No inspection requests</p>
              <p className="mt-2 text-sm text-muted">
                {listFilter === 'all'
                  ? 'When facility managers submit requests, they will appear here for review.'
                  : 'No requests match this filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((r) => (
                <div key={r.id} className="card-surface border-l-4 border-l-secondary p-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.serialNumber}</p>
                      <p className="text-sm text-muted">{r.location} · {r.requesterName}</p>
                      <p className="text-xs text-muted">Preferred: {new Date(r.preferredAt).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={r.status} kind="request" />
                  </div>
                  {r.status !== InspectionRequestStatus.APPROVED && r.status !== InspectionRequestStatus.DENIED && (
                    <button
                      type="button"
                      className="btn-primary mt-3 text-xs py-2"
                      onClick={() => startReview(r)}
                    >
                      Review
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
      <ReviewModal
        request={selected}
        inspectors={inspectors}
        onClose={() => setSelected(null)}
        onDone={() => {
          setSelected(null);
          load();
        }}
      />
    </div>
  );
}

function ReviewModal({
  request,
  inspectors,
  onClose,
  onDone,
}: {
  request: InspectionRequest | null;
  inspectors: PublicUser[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<InspectionRequestStatus>(InspectionRequestStatus.REVIEWING);
  const [adminNotes, setAdminNotes] = useState('');
  const [inspectorId, setInspectorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (request) {
      setStatus(InspectionRequestStatus.REVIEWING);
      setAdminNotes('');
      setInspectorId('');
      setScheduledAt('');
    }
  }, [request]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!request) return;
    setLoading(true);
    setError('');
    try {
      await inspectionRequestsApi.reviewRequest(request.id, {
        status,
        adminNotes: adminNotes || undefined,
        inspectorId: status === InspectionRequestStatus.APPROVED ? inspectorId : undefined,
        scheduledAt:
          status === InspectionRequestStatus.APPROVED && scheduledAt
            ? new Date(scheduledAt).toISOString()
            : undefined,
      });
      refreshAdminAlerts();
      toast.success(
        'Request updated',
        REQUEST_STATUS_LABELS[status] ?? 'Decision saved successfully.',
      );
      onDone();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={!!request} onClose={onClose} title="Review request" wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <label className="label-field">Status</label>
          <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as InspectionRequestStatus)}>
            <option value={InspectionRequestStatus.REVIEWING}>
              {REQUEST_STATUS_LABELS[InspectionRequestStatus.REVIEWING]}
            </option>
            <option value={InspectionRequestStatus.DENIED}>
              {REQUEST_STATUS_LABELS[InspectionRequestStatus.DENIED]}
            </option>
            <option value={InspectionRequestStatus.APPROVED}>
              {REQUEST_STATUS_LABELS[InspectionRequestStatus.APPROVED]}
            </option>
          </select>
        </div>
        <div>
          <label className="label-field">Admin notes</label>
          <textarea className="input-field min-h-[80px]" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
        </div>
        {status === InspectionRequestStatus.APPROVED && (
          <>
            <div>
              <label className="label-field">Assign inspector</label>
              <select className="input-field" required value={inspectorId} onChange={(e) => setInspectorId(e.target.value)}>
                <option value="">Select…</option>
                {inspectors.map((i) => (
                  <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Scheduled date & time</label>
              <input type="datetime-local" required className="input-field" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>Submit decision</button>
      </form>
    </Modal>
  );
}
