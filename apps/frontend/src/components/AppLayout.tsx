import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { UserRole } from '@fire-system/shared-types';
import { Logo } from './Logo';
import { AdminAlertBanner } from './AdminAlertBanner';
import { InspectorAlertBanner } from './InspectorAlertBanner';
import { MustChangePasswordBanner } from './MustChangePasswordBanner';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout as logoutAction } from '@/store/authSlice';
import * as authApi from '@/api/auth';
import { roleLabel } from '@/lib/roles';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean };

function navForRole(role: UserRole): NavItem[] {
  const profile = { to: '/app/profile', label: 'Profile', icon: User };
  if (role === UserRole.ADMIN) {
    return [
      { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/app/extinguishers', label: 'Extinguishers', icon: Flame },
      { to: '/app/inspection-requests', label: 'Requests', icon: ClipboardList },
      { to: '/app/inspections', label: 'Assign inspections', icon: ClipboardCheck },
      { to: '/app/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/app/reports', label: 'Reports', icon: BarChart3 },
      { to: '/app/users', label: 'Users', icon: Users },
      profile,
    ];
  }
  if (role === UserRole.INSPECTOR) {
    return [
      { to: '/app/inspector', label: 'My assignments', icon: ClipboardCheck, end: true },
      { to: '/app/inspector/work', label: 'Inspection results', icon: ClipboardList },
      { to: '/app/maintenance', label: 'Log maintenance', icon: Wrench },
      profile,
    ];
  }
  return [
    { to: '/app/extinguishers', label: 'View extinguishers', icon: Flame, end: true },
    { to: '/app/my-requests', label: 'My requests', icon: ClipboardList },
    profile,
  ];
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const nav = user ? navForRole(user.role) : [];

  const handleLogout = async () => {
    await authApi.logout();
    dispatch(logoutAction());
    navigate('/login');
  };

  const portalLabel =
    user?.role === UserRole.ADMIN
      ? 'Admin Portal'
      : user?.role === UserRole.INSPECTOR
        ? 'Inspector Portal'
        : 'Facility Portal';

  const sidebar = (
    <>
      <div className="border-b border-border px-4 py-5">
        <Logo to={user?.role === UserRole.USER ? '/app/extinguishers' : '/app'} />
        {user && (
          <p className="mt-3 text-xs text-muted">
            {user.firstName} {user.lastName}
            <span className="mt-1 block font-semibold text-secondary">{roleLabel(user.role)}</span>
            <span className="block text-[10px] uppercase tracking-wider text-muted">{portalLabel}</span>
          </p>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-card px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-primary/15 text-primary' : 'text-muted hover:bg-surface hover:text-text'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <button type="button" className="btn-ghost w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-background/80" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-card">
            <button type="button" className="absolute right-3 top-4 btn-ghost p-1" onClick={() => setMobileOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminAlertBanner />
        <InspectorAlertBanner />
        <MustChangePasswordBanner />
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-glass lg:px-8">
          <button type="button" className="btn-ghost p-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <p className="text-sm font-medium text-muted lg:hidden">{portalLabel}</p>
          <div className="ml-auto text-xs text-muted">TWZ Ltd</div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="border-t border-border px-4 py-3 text-center text-xs text-muted">
          © {new Date().getFullYear()} TWZ Ltd
        </footer>
      </div>
    </div>
  );
}
