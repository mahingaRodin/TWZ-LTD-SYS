import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Pencil, Trash2, UserPlus } from 'lucide-react';
import { UserRole, type PublicUser } from '@fire-system/shared-types';
import { Alert } from '@/components/Alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Modal } from '@/components/Modal';
import { Pagination } from '@/components/Pagination';
import { AccountBadge } from '@/components/AccountBadge';
import { RoleBadge } from '@/components/RoleBadge';
import { useToast } from '@/components/Toast';
import * as usersApi from '@/api/users';
import { getErrorMessage } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';

export function UsersPage() {
  const [items, setItems] = useState<PublicUser[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<PublicUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PublicUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.listUsers({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        role: (roleFilter as UserRole) || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await usersApi.deleteUser(deleteTarget.id);
      toast.success('User deleted', `${deleteTarget.firstName} ${deleteTarget.lastName} was removed.`);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-muted">
            Create, edit, and remove inspectors and facility managers. Admin accounts are protected.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" /> Add User
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <select
        className="input-field max-w-xs"
        value={roleFilter}
        onChange={(e) => {
          setRoleFilter(e.target.value);
          setPage(1);
        }}
      >
        <option value="">All roles</option>
        <option value={UserRole.ADMIN}>Admin</option>
        <option value={UserRole.INSPECTOR}>Inspector</option>
        <option value={UserRole.USER}>Facility Manager</option>
      </select>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-x-auto card-surface">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-medium">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <AccountBadge active={u.isActive} />
                        {!u.isVerified && (
                          <span className="text-xs text-warning">Email not verified</span>
                        )}
                        {u.mustChangePassword && (
                          <span className="text-xs text-warning">Must change password</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === UserRole.ADMIN ? (
                        <span className="text-xs text-muted">Protected account</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-ghost inline-flex items-center gap-1 text-xs py-1"
                            onClick={() => setEditUser(u)}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            className="btn-ghost inline-flex items-center gap-1 text-xs py-1 text-danger hover:text-danger"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
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

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          load();
          toast.success('User created', 'Login details were emailed to the new account.');
        }}
      />

      <EditUserModal
        user={editUser}
        onClose={() => setEditUser(null)}
        onSuccess={() => {
          setEditUser(null);
          load();
          toast.success('User updated', 'Account details were saved.');
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title="Delete user account?"
        description={
          deleteTarget
            ? `Permanently remove ${deleteTarget.firstName} ${deleteTarget.lastName} (${deleteTarget.email})? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete user"
        loading={deleteLoading}
      />
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole.INSPECTOR | UserRole.USER>(UserRole.INSPECTOR);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await usersApi.createUser({ firstName, lastName, email, role });
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Inspector or Facility Manager" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <p className="text-sm text-muted">
          Default password <strong className="text-text">user@123</strong> is emailed to the user. They must
          change it on first login.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">First Name</label>
            <input
              required
              className="input-field"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Last Name</label>
            <input
              required
              className="input-field"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label-field">Email</label>
          <input
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Role</label>
          <select
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole.INSPECTOR | UserRole.USER)}
          >
            <option value={UserRole.INSPECTOR}>Field Inspector</option>
            <option value={UserRole.USER}>Facility Manager</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </Modal>
  );
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: PublicUser | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole.INSPECTOR | UserRole.USER>(UserRole.INSPECTOR);
  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(
      user.role === UserRole.INSPECTOR || user.role === UserRole.USER
        ? user.role
        : UserRole.USER,
    );
    setIsActive(user.isActive);
    setIsVerified(user.isVerified);
    setError('');
  }, [user]);

  const persist = async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      await usersApi.updateUser(user.id, {
        firstName,
        lastName,
        email,
        role,
        isActive,
        isVerified,
      });
      setConfirmOpen(false);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setConfirmOpen(true);
  };

  return (
    <Modal open={!!user} onClose={onClose} title="Edit user" wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">First Name</label>
            <input
              required
              className="input-field"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Last Name</label>
            <input
              required
              className="input-field"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label-field">Email</label>
          <input
            type="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field">Role</label>
          <select
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole.INSPECTOR | UserRole.USER)}
          >
            <option value={UserRole.INSPECTOR}>Field Inspector</option>
            <option value={UserRole.USER}>Facility Manager</option>
          </select>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active account
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-accent"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
            />
            Email verified
          </label>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          Save changes
        </button>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void persist()}
        title="Save user changes?"
        description={
          user
            ? `Update ${user.firstName} ${user.lastName} (${user.email})? Role, active status, and verification will change immediately.`
            : ''
        }
        confirmLabel="Save changes"
        variant="primary"
        loading={loading}
      />
    </Modal>
  );
}
