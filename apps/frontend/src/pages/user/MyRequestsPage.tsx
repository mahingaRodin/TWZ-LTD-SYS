import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import type { Extinguisher, InspectionRequest } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import {
  RequestDashboardStats,
  RequestFilterTabs,
  type InspectionRequestStats,
} from '@/components/RequestDashboardStats';
import { RequestInspectionOutcome } from '@/components/RequestInspectionOutcome';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import * as extApi from '@/api/extinguishers';
import * as inspectionRequestsApi from '@/api/inspectionRequests';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import {
  requestStatusForFilter,
  type InspectionRequestListFilter,
} from '@/lib/requestFilters';

export function MyRequestsPage() {
  const [items, setItems] = useState<InspectionRequest[]>([]);
  const [stats, setStats] = useState<InspectionRequestStats | null>(null);
  const [listFilter, setListFilter] = useState<InspectionRequestListFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [error, setError] = useState('');
  const toast = useToast();

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
    extApi.listExtinguishers({ pageSize: 100 }).then((r) => setExtinguishers(r.items));
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My Inspection Requests</h1>
          <p className="mt-1 text-sm text-muted">
            Track your submissions and pass/fail outcomes — only your own requests are shown
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          <CalendarPlus className="h-4 w-4" /> Request Inspection
        </button>
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
              <p className="text-lg font-medium text-text">You have no inspection requests yet</p>
              <p className="mt-2 text-sm text-muted">
                {listFilter === 'all'
                  ? 'Use Request Inspection above to ask the admin to schedule a field visit.'
                  : 'No requests match this filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((r) => (
                <div key={r.id} className="card-surface border-l-4 border-l-accent p-4">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-semibold">{r.serialNumber}</p>
                      <p className="text-sm text-muted">{new Date(r.preferredAt).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={r.status} kind="request" />
                  </div>
                  {r.adminNotes && <p className="mt-2 text-sm text-muted">Admin: {r.adminNotes}</p>}
                  <RequestInspectionOutcome request={r} />
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
      <RequestModal
        open={open}
        extinguishers={extinguishers}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          setOpen(false);
          load();
          toast.success('Request submitted', 'An admin will review your inspection request.');
        }}
      />
    </div>
  );
}

function RequestModal({
  open,
  extinguishers,
  onClose,
  onSuccess,
}: {
  open: boolean;
  extinguishers: Extinguisher[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [extinguisherId, setExtinguisherId] = useState('');
  const [preferredAt, setPreferredAt] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await inspectionRequestsApi.createRequest({
        extinguisherId,
        preferredAt: new Date(preferredAt).toISOString(),
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
    <Modal open={open} onClose={onClose} title="Request inspection" wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div>
          <label className="label-field">Extinguisher</label>
          <select required className="input-field" value={extinguisherId} onChange={(e) => setExtinguisherId(e.target.value)}>
            <option value="">Select unit…</option>
            {extinguishers.map((ex) => (
              <option key={ex.id} value={ex.id}>{ex.serialNumber} — {ex.location}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Preferred date & time</label>
          <input type="datetime-local" required className="input-field" value={preferredAt} onChange={(e) => setPreferredAt(e.target.value)} />
        </div>
        <div>
          <label className="label-field">Notes</label>
          <textarea className="input-field min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>Submit request</button>
      </form>
    </Modal>
  );
}
