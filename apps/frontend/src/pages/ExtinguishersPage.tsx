import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import {
  ExtinguisherStatus,
  ExtinguisherType,
  type Extinguisher,
  UserRole,
} from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { StatusBadge } from '@/components/StatusBadge';
import { useToast } from '@/components/Toast';
import { EXTINGUISHER_STATUS_LABELS } from '@/lib/labels';
import * as extApi from '@/api/extinguishers';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { canEditExtinguishers, canManageExtinguishers, isExtinguisherReadOnly } from '@/lib/roles';
import { useAppSelector } from '@/store/hooks';
import { ExtinguisherForm } from './ExtinguisherForm';

export function ExtinguishersPage() {
  const role = useAppSelector((s) => s.auth.user?.role ?? UserRole.USER);
  const [items, setItems] = useState<Extinguisher[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Extinguisher | null>(null);
  const toast = useToast();
  const readOnly = isExtinguisherReadOnly(role);
  const canEdit = canEditExtinguishers(role);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await extApi.listExtinguishers({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: (statusFilter as ExtinguisherStatus) || undefined,
        type: (typeFilter as ExtinguisherType) || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this extinguisher record?')) return;
    try {
      await extApi.deleteExtinguisher(id);
      toast.success('Extinguisher removed', 'The unit was deleted from the registry.');
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const accentBorder = (status: string) => {
    if (status === 'EXPIRED') return 'border-l-primary';
    if (status === 'ACTIVE') return 'border-l-accent';
    if (status === 'MAINTENANCE') return 'border-l-secondary';
    return 'border-l-border';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Fire Extinguishers</h1>
          <p className="mt-1 text-sm text-muted">
            {readOnly
              ? 'View-only fleet registry — contact an admin to update records'
              : 'Fleet registry across TWZ facilities'}
          </p>
        </div>
        {canManageExtinguishers(role) && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Register Unit
          </button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="card-surface flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            className="input-field pl-10"
            placeholder="Search serial or location…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input-field w-full sm:w-40"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {Object.values(ExtinguisherStatus).map((s) => (
            <option key={s} value={s}>
              {EXTINGUISHER_STATUS_LABELS[s] ?? s}
            </option>
          ))}
        </select>
        <select
          className="input-field w-full sm:w-40"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All types</option>
          {Object.values(ExtinguisherType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <p className="text-center text-muted py-12">No extinguishers found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((ex) => (
                  <tr key={ex.id} className="border-b border-border/60 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium">{ex.serialNumber}</td>
                    <td className="px-4 py-3 text-muted">{ex.location}</td>
                    <td className="px-4 py-3">{ex.type}</td>
                    <td className="px-4 py-3">{ex.expiryDate}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ex.status} kind="extinguisher" />
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-ghost text-xs"
                            onClick={() => {
                              setEditing(ex);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </button>
                          {canManageExtinguishers(role) && (
                            <button
                              type="button"
                              className="btn-ghost text-xs text-danger"
                              onClick={() => handleDelete(ex.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:hidden">
            {items.map((ex) => (
              <div
                key={ex.id}
                className={`card-surface border-l-4 p-4 ${accentBorder(ex.status)}`}
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold">{ex.serialNumber}</p>
                  <StatusBadge status={ex.status} kind="extinguisher" />
                </div>
                <p className="mt-1 text-sm text-muted">{ex.location}</p>
                <p className="mt-2 text-xs text-muted">
                  {ex.type} · {ex.size} · Expires {ex.expiryDate}
                </p>
                {canEdit && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary flex-1 text-xs py-2"
                      onClick={() => {
                        setEditing(ex);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <Link
                      to="/app/inspections"
                      state={{ extinguisherId: ex.id }}
                      className="btn-ghost flex-1 text-center text-xs py-2"
                    >
                      Inspect
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Update Extinguisher' : 'Register Extinguisher'}
        wide
      >
        <ExtinguisherForm
          initial={editing}
          onSuccess={() => {
            setModalOpen(false);
            load();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
