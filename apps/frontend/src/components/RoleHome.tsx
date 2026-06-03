import { Navigate } from 'react-router-dom';
import { UserRole } from '@fire-system/shared-types';
import { useAppSelector } from '@/store/hooks';
import { DashboardPage } from '@/pages/DashboardPage';

/** Role-specific landing route inside /app */
export function RoleHome() {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role === UserRole.INSPECTOR) return <Navigate to="/app/inspector" replace />;
  if (role === UserRole.USER) return <Navigate to="/app/extinguishers" replace />;
  return <DashboardPage />;
}
