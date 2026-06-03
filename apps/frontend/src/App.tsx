import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/components/AuthLayout';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyOtpPage } from '@/pages/auth/VerifyOtpPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { RoleHome } from '@/components/RoleHome';
import { InspectionRequestsPage } from '@/pages/admin/InspectionRequestsPage';
import { MyRequestsPage } from '@/pages/user/MyRequestsPage';
import { InspectorPortalPage } from '@/pages/inspector/InspectorPortalPage';
import { InspectorWorkPage } from '@/pages/inspector/InspectorWorkPage';
import { ExtinguishersPage } from '@/pages/ExtinguishersPage';
import { InspectionsPage } from '@/pages/InspectionsPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { ReportsPage } from '@/pages/ReportsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { UsersPage } from '@/pages/UsersPage';
import { UserRole } from '@fire-system/shared-types';
import { useAppSelector } from '@/store/hooks';

function GuestOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role !== UserRole.ADMIN) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function InspectorOnly({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role !== UserRole.INSPECTOR) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function FacilityOnly({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role !== UserRole.USER) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function MaintenanceAccess({ children }: { children: React.ReactNode }) {
  const role = useAppSelector((s) => s.auth.user?.role);
  if (role !== UserRole.ADMIN && role !== UserRole.INSPECTOR) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route
          path="/forgot-password"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<RoleHome />} />
          <Route path="extinguishers" element={<ExtinguishersPage />} />
          <Route path="inspection-requests" element={<AdminOnly><InspectionRequestsPage /></AdminOnly>} />
          <Route path="my-requests" element={<FacilityOnly><MyRequestsPage /></FacilityOnly>} />
          <Route path="inspector" element={<InspectorOnly><InspectorPortalPage /></InspectorOnly>} />
          <Route path="inspector/work" element={<InspectorOnly><InspectorWorkPage /></InspectorOnly>} />
          <Route path="inspections" element={<AdminOnly><InspectionsPage /></AdminOnly>} />
          <Route path="maintenance" element={<MaintenanceAccess><MaintenancePage /></MaintenanceAccess>} />
          <Route path="reports" element={<AdminOnly><ReportsPage /></AdminOnly>} />
          <Route path="users" element={<AdminOnly><UsersPage /></AdminOnly>} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
